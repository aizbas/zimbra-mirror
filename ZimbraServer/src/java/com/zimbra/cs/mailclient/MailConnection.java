package com.zimbra.cs.mailclient;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.apache.log4j.Level;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.SocketFactory;
import javax.security.auth.login.LoginException;
import javax.security.sasl.Sasl;
import javax.security.sasl.SaslException;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.Socket;
import java.util.Map;

import com.zimbra.cs.mailclient.imap.ImapConfig;
import com.zimbra.cs.mailclient.imap.ImapConnection;
import com.zimbra.cs.mailclient.pop3.Pop3Config;
import com.zimbra.cs.mailclient.pop3.Pop3Connection;
import com.zimbra.cs.mailclient.util.TraceInputStream;
import com.zimbra.cs.mailclient.util.TraceOutputStream;

public abstract class MailConnection {
    protected MailConfig config;
    protected Socket socket;
    protected ClientAuthenticator authenticator;
    protected TraceInputStream traceIn;
    protected TraceOutputStream traceOut;
    protected MailInputStream mailIn;
    protected MailOutputStream mailOut;
    protected State state = State.CLOSED;

    protected enum State {
        CLOSED, NOT_AUTHENTICATED, AUTHENTICATED, SELECTED, LOGOUT
    }
    private static final String LOGIN = "LOGIN";

    protected MailConnection() {}

    protected MailConnection(MailConfig config) {
        this.config = config;
        if (config.isDebug()) {
            getLogger().setLevel(Level.DEBUG);
        }
    }

    public static MailConnection newInstance(MailConfig config) {
        if (config instanceof ImapConfig) {
            return new ImapConnection((ImapConfig) config);
        } else if (config instanceof Pop3Config) {
            return new Pop3Connection((Pop3Config) config);
        } else {
            throw new IllegalArgumentException(
                "Unsupported protocol: " + config.getProtocol());
        }
    }

    public synchronized void connect() throws IOException {
        if (!isClosed()) return;
        socket = newSocket();
        initStreams(new BufferedInputStream(socket.getInputStream()),
                    new BufferedOutputStream(socket.getOutputStream()));
        processGreeting();
        if (config.isTlsEnabled() && !config.isSslEnabled()) {
            startTls();
        }
        if (state == State.CLOSED) {
            setState(State.NOT_AUTHENTICATED);
        }
    }

    protected void initStreams(InputStream is, OutputStream os)
        throws IOException {
        if (config.isTrace()) {
            is = traceIn = newTraceInputStream(is);
            os = traceOut = newTraceOutputStream(os);
        }
        mailIn = getMailInputStream(is);
        mailOut = getMailInputStream(os);
    }

    protected abstract void processGreeting() throws IOException;
    protected abstract void sendLogin(String user, String pass) throws IOException;
    protected abstract void sendAuthenticate(boolean ir) throws IOException;
    protected abstract void sendStartTls() throws IOException;
    protected abstract MailInputStream getMailInputStream(InputStream is);
    protected abstract MailOutputStream getMailInputStream(OutputStream os);
    public abstract Logger getLogger();

    public abstract void logout() throws IOException;

    public synchronized void login(String pass) throws IOException {
        if (pass == null) throw new NullPointerException("password");
        checkState(State.NOT_AUTHENTICATED);
        String user = config.getAuthenticationId();
        if (user == null) {
            throw new IllegalStateException("Authentication id missing");
        }
        sendLogin(user, pass);
        setState(State.AUTHENTICATED);
    }
    
    public synchronized void authenticate(String pass)
        throws LoginException, IOException {
        checkState(State.NOT_AUTHENTICATED);
        String mech = config.getMechanism();
        if (mech == null || mech.equalsIgnoreCase(LOGIN)) {
            login(pass);
            return;
        }                  
        authenticator = newAuthenticator();
        authenticator.setPassword(pass);
        authenticator.initialize();
        sendAuthenticate(false);
        if (authenticator.isEncryptionEnabled()) {
            initStreams(authenticator.getUnwrappedInputStream(socket.getInputStream()),
                        authenticator.getWrappedOutputStream(socket.getOutputStream()));
        }
        setState(State.AUTHENTICATED);
    }

    protected void processContinuation(String s) throws IOException {
        byte[] response = authenticator.evaluateChallenge(decodeBase64(s));
        if (response != null) {
            mailOut.writeLine(encodeBase64(response));
            mailOut.flush();
        }
    }

    private static byte[] decodeBase64(String s) throws SaslException {
        try {
            return Base64.decodeBase64(s.getBytes("us-ascii"));
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("US-ASCII encoding unsupported");
        }
    }

    protected static String encodeBase64(byte[] b) {
        try {
            return new String(Base64.encodeBase64(b), "us-ascii");
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("US-ASCII encoding unsupported");
        }
    }

    protected synchronized void startTls() throws IOException {
        checkState(State.NOT_AUTHENTICATED);
        sendStartTls();
        SSLSocket sock = newSSLSocket(socket);
        try {
            sock.startHandshake();
            initStreams(sock.getInputStream(), sock.getOutputStream());
        } catch (IOException e) {
            close();
            throw e;
        }
    }

    public String getNegotiatedQop() {
        return authenticator != null ?
            authenticator.getNegotiatedProperty(Sasl.QOP) : null;
    }

    public void setTraceEnabled(boolean enabled) {
        if (traceIn != null) {
            traceIn.setEnabled(enabled);
        }
        if (traceOut != null) {
            traceOut.setEnabled(enabled);
        }
    }

    public MailInputStream getInputStream() {
        return mailIn;
    }

    public MailOutputStream getOutputStream() {
        return mailOut;
    }

    public MailConfig getConfig() {
        return config;
    }

    public synchronized boolean isClosed() {
        return state == State.CLOSED;
    }

    public synchronized boolean isAuthenticated() {
        return state == State.AUTHENTICATED;
    }

    protected synchronized void setState(State state) {
        getLogger().debug("setState: " + this.state + " -> " + state);
        this.state = state;
        notifyAll();
    }

    protected void checkState(State expected) {
        if (state != expected) {
            throw new IllegalStateException(
                "Operation not supported in " + state + " state");
        }
    }
    
    public synchronized void close() {
        if (isClosed()) return;
        setState(State.CLOSED);
        try {
            socket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        if (authenticator != null) {
            try {
                authenticator.dispose();
            } catch (SaslException e) {
                e.printStackTrace();
            }
        }
    }

    public ClientAuthenticator newAuthenticator() {
        if (config.getAuthenticationId() == null) {
            throw new IllegalStateException("Missing required authentication id");
        }
        ClientAuthenticator ca = new ClientAuthenticator(
            config.getMechanism(), config.getProtocol(), config.getHost());
        ca.setAuthorizationId(config.getAuthorizationId());
        ca.setAuthenticationId(config.getAuthenticationId());
        ca.setRealm(config.getRealm());
        ca.setDebug(config.isDebug());
        Map<String, String> props = config.getSaslProperties();
        if (props != null) {
            ca.getProperties().putAll(props);
        }
        return ca;
    }

    private Socket newSocket() throws IOException {
        SocketFactory sf = config.isSslEnabled() ?
            getSSLSocketFactory() : SocketFactory.getDefault();
        return sf.createSocket(config.getHost(), config.getPort());
    }

    private SSLSocket newSSLSocket(Socket sock) throws IOException {
        return (SSLSocket) getSSLSocketFactory().createSocket(
            sock, sock.getInetAddress().getHostName(), sock.getPort(), false);
    }

    private SSLSocketFactory getSSLSocketFactory() {
        SSLSocketFactory ssf = config.getSSLSocketFactory();
        return ssf != null ? ssf : (SSLSocketFactory) SSLSocketFactory.getDefault();
    }

    private TraceInputStream newTraceInputStream(InputStream is) {
        return new TraceInputStream(is, config.getTraceOut());
    }

    private TraceOutputStream newTraceOutputStream(OutputStream os) {
        return new TraceOutputStream(os, config.getTraceOut());
    }
}
