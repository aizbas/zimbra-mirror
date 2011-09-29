/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011 Zimbra, Inc.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */
package com.zimbra.cs.index;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.zimbra.cs.mailbox.Mailbox;
import com.zimbra.common.service.ServiceException;
import com.zimbra.common.util.SetUtil;

import com.zimbra.common.util.ZimbraLog;

/**
 * A list of query operations which are unioned together.
 *
 * @since Oct 29, 2004
 */
public final class UnionQueryOperation extends CombiningQueryOperation {

    private boolean atStart = true; // don't re-fill buffer twice if they call hasNext() then reset() w/o actually getting next
    private ZimbraHit cachedNextHit = null;

    @Override
    public long getCursorOffset() {
        return -1;
    }

    @Override
    QueryTargetSet getQueryTargets() {
        QueryTargetSet result = new QueryTargetSet();
        for (QueryOperation op : operations) {
            result = (QueryTargetSet)SetUtil.union(result, op.getQueryTargets());
        }
        return result;
    }

    @Override
    public void resetIterator() throws ServiceException {
        if (!atStart) {
            for (Iterator<QueryOperation> iter = operations.iterator(); iter.hasNext(); ) {
                QueryOperation q = iter.next();
                q.resetIterator();
            }
            cachedNextHit = null;
            internalGetNext();
        }
    }

    @Override
    public ZimbraHit getNext() throws ServiceException {
        atStart = false;
        ZimbraHit toRet = cachedNextHit;
        // this "if" is here so we don't keep calling internalGetNext when we've reached the end of the results...
        if (cachedNextHit != null) {
            cachedNextHit = null;
            internalGetNext();
        }

        return toRet;
    }

    @Override
    public ZimbraHit peekNext() {
        return cachedNextHit;
    }

    private void internalGetNext() throws ServiceException {
        if (cachedNextHit == null) {
            if (context.getResults().getSortBy() == SortBy.NONE) {
                for (QueryOperation op : operations) {
                    cachedNextHit = op.getNext();
                    if (cachedNextHit != null) {
                        return;
                    }
                }
                // no more results!

            } else {
                // mergesort: loop through QueryOperations and find the "best" hit
                int currentBestHitOffset = -1;
                ZimbraHit currentBestHit = null;
                for (int i = 0; i < operations.size(); i++) {
                    QueryOperation op = operations.get(i);
                    if (op.hasNext()) {
                        if (currentBestHitOffset == -1) {
                            currentBestHitOffset = i;
                            currentBestHit = op.peekNext();
                        } else {
                            ZimbraHit opNext = op.peekNext();
                            int result = opNext.compareTo(context.getResults().getSortBy(), currentBestHit);
                            if (result < 0) {
                                // "before"
                                currentBestHitOffset = i;
                                currentBestHit = opNext;
                            }
                        }
                    }
                }
                if (currentBestHitOffset > -1) {
                    cachedNextHit = operations.get(currentBestHitOffset).getNext();
                    assert(cachedNextHit == currentBestHit);
                }
            }
        }
    }


    @Override
    public void close() throws IOException {
        for (QueryOperation op : operations) {
            op.close();
        }
    }

    @Override
    public boolean hasSpamTrashSetting() {
        for (QueryOperation op : operations) {
            if (!op.hasSpamTrashSetting()) {
                return false;
            }
        }
        return true;
    }

    @Override
    void forceHasSpamTrashSetting() {
        for (QueryOperation op : operations) {
            op.forceHasSpamTrashSetting();
        }
    }

    QueryTarget getQueryTarget(QueryTarget targetOfParent) {
        return targetOfParent;
    }

    @Override
    boolean hasNoResults() {
        return false;
    }

    @Override
    boolean hasAllResults() {
        return false;
    }

    @Override
    QueryOperation expandLocalRemotePart(Mailbox mbox) throws ServiceException {
        List<QueryOperation> newList = new ArrayList<QueryOperation>();
        for (QueryOperation op : operations) {
            newList.add(op.expandLocalRemotePart(mbox));
        }
        operations = newList;
        return this;
    }

    @Override
    QueryOperation ensureSpamTrashSetting(Mailbox mbox, boolean includeTrash, boolean includeSpam) throws ServiceException {
        List<QueryOperation> newList = new ArrayList<QueryOperation>(operations.size());
        for (QueryOperation op : operations) {
            if (!op.hasSpamTrashSetting()) {
                newList.add(op.ensureSpamTrashSetting(mbox, includeTrash, includeSpam));
            } else {
                newList.add(op);
            }
        }
        assert(newList.size() == operations.size());
        operations = newList;
        return this;
    }


    public void add(QueryOperation op) {
        operations.add(op);
    }

    void pruneIncompatibleTargets(QueryTargetSet targets) {
        // go from end--front so we don't get confused when entries are removed
        for (int i = operations.size() - 1; i >= 0; i--) {
            QueryOperation op = operations.get(i);
            if (op instanceof UnionQueryOperation) {
                assert(false); // shouldn't be here, should have optimized already
                ((UnionQueryOperation) op).pruneIncompatibleTargets(targets);
            } else if (op instanceof IntersectionQueryOperation) {
                ((IntersectionQueryOperation) op).pruneIncompatibleTargets(targets);
            } else {
                QueryTargetSet qts = op.getQueryTargets();
                assert(qts.size() <= 1);
                if ((qts.size() == 0) || (!qts.isSubset(targets) && !qts.contains(QueryTarget.UNSPECIFIED))) {
                    operations.remove(i);
                }
            }
        }
    }

    @Override
    public QueryOperation optimize(Mailbox mbox) throws ServiceException {
        OPTIMIZE_LOOP: while (true) {
            for (int i = 0; i < operations.size(); i++) {
                QueryOperation op = operations.get(i);
                QueryOperation optimized = op.optimize(mbox);
                if (optimized == null || optimized instanceof NoTermQueryOperation) {
                    operations.remove(i);
                } else if (op != optimized) {
                    operations.remove(i);
                    operations.add(optimized);
                    continue OPTIMIZE_LOOP;
                }
            }
            break;
        }

        if (operations.isEmpty()) {
            return new NoTermQueryOperation();
        }

        JOIN_LOOP: while (true) {
            for (int i = 0; i < operations.size(); i++) {
                QueryOperation lhs = operations.get(i);

                // if one of our direct children is an OR, then promote all of its
                // elements to our level -- this can happen if a subquery has
                // ORed terms at the top level
                if (lhs instanceof UnionQueryOperation) {
                    combineOps(lhs, true);
                    operations.remove(i);
                    continue JOIN_LOOP;
                }

                for (int j = i+1; j < operations.size(); j++) {
                    QueryOperation rhs = operations.get(j);
                    QueryOperation joined = lhs.combineOps(rhs,true);
                    if (joined != null) {
                        operations.remove(j);
                        operations.remove(i);
                        operations.add(joined);
                        continue JOIN_LOOP;
                    }
                }
            }
            break;
        }

        // now - check to see if we have only one child -- if so, then WE can be eliminated, so push the child up
        if (operations.size() == 1) {
            return operations.get(0);
        }

        return this;
    }

    @Override
    String toQueryString() {
        StringBuilder out = new StringBuilder("(");

        boolean atFirst = true;

        for (QueryOperation op : operations) {
            if (!atFirst) {
                out.append(" OR ");
            }
            out.append(op.toQueryString());
            atFirst = false;
        }
        return out.append(')').toString();
    }

    @Override
    public String toString() {
        StringBuilder out = new StringBuilder("UNION{");

        boolean atFirst = true;

        for (QueryOperation op : operations) {
            if (atFirst) {
                atFirst = false;
            } else {
                out.append(" OR ");
            }
            out.append(op);
        }
        return out.append('}').toString();
    }

    @Override
    public Object clone() {
        assert(cachedNextHit == null);
        UnionQueryOperation result = (UnionQueryOperation) super.clone();
        result.operations = new ArrayList<QueryOperation>(operations.size());
        for (QueryOperation op : operations) {
            result.operations.add((QueryOperation) op.clone());
        }
        return result;
    }

    @Override
    protected QueryOperation combineOps(QueryOperation other, boolean union) {
        if (union && other instanceof UnionQueryOperation) {
            operations.addAll(((UnionQueryOperation) other).operations);
            return this;
        }
        return null;
    }

    @Override
    protected void begin(QueryContext ctx) throws ServiceException {
        assert(context == null);
        context = ctx;
        for (QueryOperation op : operations) {
            ZimbraLog.search.debug("Executing: %s", op);
            // add 1 to chunk size b/c we buffer
            op.begin(new QueryContext(ctx.getMailbox(), ctx.getResults(), ctx.getParams(), ctx.getChunkSize() + 1));
        }
        internalGetNext();
    }

    @Override
    public List<QueryInfo> getResultInfo() {
        List<QueryInfo> result = new ArrayList<QueryInfo>();
        for (QueryOperation op : operations) {
            result.addAll(op.getResultInfo());
        }
        return result;
    }

    @Override
    protected void depthFirstRecurse(RecurseCallback cb) {
        for (QueryOperation op : operations) {
            op.depthFirstRecurse(cb);
        }
        cb.recurseCallback(this);
    }

}
