#!/usr/bin/perl 
# 
# ***** BEGIN LICENSE BLOCK *****
# 
# Zimbra Collaboration Suite Server
# Copyright (C) 2008 Zimbra, Inc.
# 
# The contents of this file are subject to the Yahoo! Public License
# Version 1.0 ("License"); you may not use this file except in
# compliance with the License.  You may obtain a copy of the License at
# http://www.zimbra.com/license.
# 
# Software distributed under the License is distributed on an "AS IS"
# basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
# 
# ***** END LICENSE BLOCK *****
# 

use strict;
use lib "./zimbramon/lib";

my @modules =qw(AnyDBM_File Archive::Zip Benchmark BerkeleyDB Carp Compress::Zlib Convert::TNEF Convert::UUlib Crypt::SaltedHash Cwd DBI Data::Dumper Data::UUID Date::Calc Date::Format Date::Manip Date::Parse Digest::MD5 Encode English Errno Exporter Fcntl File::Basename File::Copy File::Find File::Grep File::Path File::Spec File::Tail File::Temp FileHandle FindBin Getopt::Long Getopt::Std HTTP::Request IO::File IO::Handle IO::Select IO::Socket IO::Socket::INET IO::Socket::UNIX IO::Wrap IPC::Open3 LWP::UserAgent MIME::Base64 MIME::Entity MIME::Parser MIME::Words Mail::Mailer Mail::SpamAssassin Mail::SpamAssassin::ArchiveIterator Mail::SpamAssassin::Message Mail::SpamAssassin::PerMsgLearner Mail::SpamAssassin::Util::Progress Math::BigFloat Net::DNS::Resolver Net::LDAP Net::LDAP::Entry Net::LDAP::LDIF Net::LDAPapi Net::Ping Net::SMTP Net::SSLeay Net::Server POSIX Pod::Usage Proc::ProcessTable SOAP::Lite SOAP::Transport::HTTP Socket Swatch::Actions Swatch::Throttle Sys::Hostname Term::ReadKey Term::ReadLine Time::HiRes Time::Local Unix::Syslog bytes constant lib re sigtrap strict subs vars warnings);
foreach my $m (@modules) {
  load_module($m); 
}

sub load_module($) {
  my ($m) = @_;
  local($_) = $m;
  $_ .= /^auto::/ ? '.al' : '.pm'  if !m{^/} && !m{\.(pm|pl|al|ix)\z};
  s{::}{/}g;
  eval { require $_; } 
  or do {
    
    my($eval_stat) = $@ ne '' ? $@ =~ /(\S+\s\S+\s\S+)/ : "errno=$!";  chomp $eval_stat;
    print "$m: $eval_stat\n";
  }
}
