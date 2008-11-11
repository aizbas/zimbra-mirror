package com.zimbra.cs.account.accesscontrol;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.zimbra.common.service.ServiceException;
import com.zimbra.common.util.Log;
import com.zimbra.common.util.LogFactory;
import com.zimbra.common.util.SetUtil;
import com.zimbra.cs.account.AccessManager;
import com.zimbra.cs.account.AccessManager.ViaGrant;
import com.zimbra.cs.account.Account;
import com.zimbra.cs.account.AttributeClass;
import com.zimbra.cs.account.AttributeManager;
import com.zimbra.cs.account.DistributionList;
import com.zimbra.cs.account.Entry;
import com.zimbra.cs.account.Provisioning;
import com.zimbra.cs.account.Provisioning.DistributionListBy;
import com.zimbra.cs.account.Provisioning.MemberOf;

public class RightChecker {

    private static final Log sLog = LogFactory.getLog(RightChecker.class);
    
    /**
     * Helper class for checking rights.
     * 
     * Wraps:
     *   - List of ACEs on an entry with the needed right, negative grants are in the front
     *   - TargetType on which the right is granted
     *   - Entry on which the right is granted
     *   - Distance to the perspective target
     *   
     *   e.g for this hierarchy:
     *      grantA on globalgrant                                  
     *      grantB on domain test.com                              
     *      grantC on group g1@test.com                            
     *      grantD on group g2@test.com (g2 is a member of g1 and user is a member of g2)     
     *      grantE on group g3@test.com (user is a member of g3)     
     *      grantF on account user@test.com                        
     *      
     *   distance would be:
     *     for canPerform(..., user@test.com, ...), distance for each grant is:
     *         grantF: 0
     *         grantE: 1
     *         grantD: 1
     *         grantC: 2
     *         grantB: 3
     *         grantA: 4
     *         
     *     for canPerform(..., g3@test.com, ...), distance for each grant is:
     *         grantE: 0
     *         grantB: 1
     *         grantA: 2
     *         
     *     for canPerform(..., g2@test.com, ...), distance for each grant is:    
     *         grantD: 0
     *         grantC: 1
     *         grantB: 2
     *         grantA: 3
     *
     *     for canPerform(..., g1@test.com, ...), distance for each grant is:    
     *         grantC: 0
     *         grantB: 1
     *         grantA: 1
     *         
     *     for canPerform(..., test.com, ...), distance for each grant is:    
     *         grantB: 0
     *         grantA: 1
     *         
     *     for canPerform(..., globalgrant, ...), distance for each grant is:    
     *         grantA: 0
     *   
     */
    static class EffectiveACL {
        private TargetType mGrantedOnEntryType; // target type on which the aces are granted
        private Entry mGrantedOnEntry;          // entry object on which the aces are granted
        private int mDistanceToTarget;          // distance to the perspective target
        
        private List<ZimbraACE> mAces;          // grants on the entry with the the right of interest
                
        EffectiveACL(TargetType grantedOnEntryType, Entry grantedOnEntry, int distanceToTarget, List<ZimbraACE> aces) throws ServiceException {
            mGrantedOnEntryType = grantedOnEntryType;
            mGrantedOnEntry = grantedOnEntry;
            mDistanceToTarget = distanceToTarget;
            
            // sanity check, an EffectiveACL must have aces, otherwise it should not be constructed
            if (aces == null)
                throw ServiceException.FAILURE("internal error", null);
            mAces = aces;
        }
        
        List<ZimbraACE> getAces() {
            return mAces;
        }
        
        TargetType getGrantedOnEntryType() {
            return mGrantedOnEntryType;
        }
        
        Entry getGrantedOnEntry() {
            return mGrantedOnEntry;
        }
       
        int getDistanceToTarget() {
            return mDistanceToTarget;
        }
        
        /*
         * ({entry name on which the right is granted}: [grant] [grant] ...)
         */
        String dump() {
            StringBuffer sb = new StringBuffer();
            
            sb.append("(" + mGrantedOnEntry.getLabel() + ": ");
            for (ZimbraACE ace : mAces)
                sb.append(ace.dump() + " ");
            sb.append(")");
            
            return sb.toString();
        }
    }
    
    static class ACEViaGrant extends ViaGrant {
        String mTargetType;
        String mTargetName;
        String mGranteeType;
        String mGranteeName;
        String mRight;
        boolean mIsNegativeGrant;
        
        ACEViaGrant(TargetType targetType,
                    Entry target,
                    GranteeType granteeType,
                    String granteeName,
                    Right right,
                    boolean isNegativeGrant) {
            mTargetType = targetType.getCode();
            mTargetName = target.getLabel();
            mGranteeType = granteeType.getCode();
            mGranteeName = granteeName;
            mRight = right.getName();
            mIsNegativeGrant = isNegativeGrant;
        }
        
        public String getTargetType() { 
            return mTargetType;
        } 
        
        public String getTargetName() {
            return mTargetName;
        }
        
        public String getGranteeType() {
            return mGranteeType;
        }
        
        public String getGranteeName() {
            return mGranteeName;
        }
        
        public String getRight() {
            return mRight;
        }
        
        public boolean isNegativeGrant() {
            return mIsNegativeGrant;
        }
    }
    
    /**
     * returns if grantee 
     * 
     * @param effectiveACEs all grants on the target hierarchy for the requested right
     * @param grantee
     * @return
     * @throws ServiceException
     */
    static boolean canDo(List<EffectiveACL> effectiveACLs, Account grantee, Right right, ViaGrant via) throws ServiceException {
        Boolean result = null;
        
        if (sLog.isDebugEnabled()) {
            sLog.debug("RightChecker.canDo: effectiveACLs=" + dump(effectiveACLs));
        }
        
        short adminFlag = (right.isUserRight()? 0 : GranteeFlag.F_ADMIN);
        
        // as an individual
        result = check(effectiveACLs, grantee, right, via, (short)(GranteeFlag.F_INDIVIDUAL | adminFlag));
        if (result != null)
            return result;
        
        // as a group member
        result = checkGroup(effectiveACLs, grantee, right, via, (short)(GranteeFlag.F_GROUP | adminFlag));
        if (result != null)
            return result;
        
        if (right.isUserRight()) {
            // as an authed user
            result = check(effectiveACLs, grantee, right, via, GranteeFlag.F_AUTHUSER);
            if (result != null)
                return result;
            
            // as public 
            result = check(effectiveACLs, grantee, right, via, GranteeFlag.F_PUBLIC);
            if (result != null)
                return result;
        }
        
        // no match, return denied
        return false;
    }
    
    /*
     * for allowSome, if an attr is allowed at the same distance as the denyAll grant, denied takes precedence,
     * thusthe operator is <
     */
    static HashMap<String, Boolean> allowSome(Map<String, Integer> allowed, int withDistanceShorterthan, Set<String> allowedWithLimit) {
        HashMap<String, Boolean> result = new HashMap<String, Boolean>();
        for (Map.Entry<String, Integer> a : allowed.entrySet()) {
            if (a.getValue() < withDistanceShorterthan)
                result.put(a.getKey(), allowedWithLimit.contains(a.getKey()));
        }
        return result;
    }
    
    /*
     * for denySome, if an attr is denied at the same distance as the allowAll grant, denied takes precedence, 
     * thus the operator is <=
     */
    static HashMap<String, Boolean> denySome(Set<String> all, Map<String, Integer> denied, int withDistanceShorterthanOrEqualTo, Set<String> allowedWithLimit) {
        HashMap<String, Boolean> result = new HashMap<String, Boolean>();

        for (Map.Entry<String, Integer> d : denied.entrySet()) {
            if (d.getValue() <= withDistanceShorterthanOrEqualTo)
                all.remove(d.getKey());
        }
        
        for (String d : all)
            result.put(d, allowedWithLimit.contains(d));
        return result;
    }
    
    static private Map<String, Boolean> encounteredDenyAll(Map<String, Integer> allowSome, int shortestDenyAllAt, Set<String> allowSomeWithLimit) {
        if (allowSome.isEmpty())
            return AccessManager.DENY_ALL_ATTRS;
        else 
            return allowSome(allowSome, shortestDenyAllAt, allowSomeWithLimit); 
    }

    static private Map<String, Boolean> encounteredAllowAll(Map<String, Integer> denySome,  int shortestAllowAllAt, Set<String> allowSomeWithLimit, AttributeClass klass) throws ServiceException {
        if (denySome.isEmpty())
            return AccessManager.ALLOW_ALL_ATTRS;
        else {
            Set<String> all = new HashSet<String>();
            all.addAll(AttributeManager.getInstance().getAttrsInClass(klass));
            return denySome(all, denySome, shortestAllowAllAt, allowSomeWithLimit);
        }
    }
    
    static Map<String, Boolean> canAccessAttrs(List<EffectiveACL> effectiveACLs, Account grantee, Right right, AttributeClass klass) throws ServiceException {
        Provisioning prov = Provisioning.getInstance();
        
        Map<String, Boolean> result = null;
        
        Map<String, Integer> allowSome = new HashMap<String, Integer>();
        Map<String, Integer> denySome = new HashMap<String, Integer>();
        List<Integer> allowAll = new ArrayList<Integer>();
        List<Integer> denyAll = new ArrayList<Integer>();
        Set<String> allowSomeWithLimit = new HashSet<String>();
        
        /*
         * traverse the effective ACLs, which is sorted in the order of most to least specific targets.
         * first pass visits the user grantees, second pass visits the group grantees
         */
        
        int baseDistance = 0;
        
        // collect attrs in grants that are granted directly to the authed account
        baseDistance = collectAttrs(effectiveACLs, grantee.getId(), baseDistance, 
                                    allowSome, denySome, allowAll, denyAll, allowSomeWithLimit);
        
        // walk up the group hierarchy of the authed account, collect attrs that are granted to the group
        List<MemberOf> groups = prov.getAclGroups((Account)grantee);
        for (MemberOf group : groups) {
            baseDistance = collectAttrs(effectiveACLs, group.getId(), baseDistance, 
                                        allowSome, denySome, allowAll, denyAll, allowSomeWithLimit);
        }

        // now allowed/denied contain all attrs allowed/denied and their shortest distance to the target
        // remove the denied ones from allowed if they've got a shorter distance
        Map<String, Integer> some = null;
        if (!denyAll.isEmpty() && !allowAll.isEmpty()) {
            int shortestDenyAllAt = denyAll.get(0);
            int shortestAllowAllAt = allowAll.get(0);
            if (shortestDenyAllAt <= shortestAllowAllAt)
                result = encounteredDenyAll(allowSome, shortestDenyAllAt, allowSomeWithLimit);
            else
                result = encounteredAllowAll(denySome, shortestAllowAllAt, allowSomeWithLimit, klass);
                 
        } else if (!denyAll.isEmpty()) {
            int shortestDenyAllAt = denyAll.get(0);
            result = encounteredDenyAll(allowSome, shortestDenyAllAt, allowSomeWithLimit);
            
        } else if (!allowAll.isEmpty()) {
            int shortestAllowAllAt = allowAll.get(0);
            result = encounteredAllowAll(denySome, shortestAllowAllAt, allowSomeWithLimit, klass);
            
        } else {
            Set<String> conflicts = SetUtil.intersect(allowSome.keySet(), denySome.keySet());
            if (!conflicts.isEmpty()) {
                for (String attr : conflicts) {
                    if (denySome.get(attr) <= allowSome.get(attr))
                        allowSome.remove(attr);
                }
            }
            result = new HashMap<String, Boolean>();
            for (String attr : allowSome.keySet()) 
                result.put(attr, allowSomeWithLimit.contains(attr));
        }
        
        return result;
    }

    
    /**
     * Iterate through the effective ACLs to determine if the right is allowed or denied to the grantee.
     * 
     * The effectiveACLs list contains all grants on all entries with the specified right that could 
     * influence the result.   Each EffectiveACL contains grants with the specified right on one target entry.
     * 
     * The List is sorted as follows:
     * - from the most specific target entry to the least specific target entry
     * - on the same target entry, negative grants are in the front, positive grants are in the rear
     * 
     * @param effectiveACLs
     * @param grantee
     * @param right
     * @param via
     * @param granteeFlags
     * @return
     * @throws ServiceException
     */
    private static Boolean check(List<EffectiveACL> effectiveACLs, Account grantee, Right right, ViaGrant via, short granteeFlags) throws ServiceException {
        Boolean result = null;
        for (EffectiveACL acl : effectiveACLs) {
            for (ZimbraACE ace : acl.getAces()) {
                GranteeType granteeType = ace.getGranteeType();
                if (!granteeType.hasFlags(granteeFlags))
                    continue;
                
                if (ace.matchesGrantee(grantee))
                    return gotResult(acl, ace, grantee, right, via);
            }
        }
        return result;
    }

    /**
     * Check group grantees.  Group grantees are checked differently because we need to take consideration 
     * relativity of a group grantee to the perspective authed user - relativity on target hierarchy and 
     * grantee hierarchy can conflict.  
     * 
     * For example, for this target hierarchy:
     *      domain D
     *          group G1 (allow right R to group GC)
     *              group G2 (deny right R to group GB)
     *                  group G3 (deny right R to group GA)
     *                      user account U   
     *                  
     *  And this grantee hierarchy:
     *      group GA
     *          group GB
     *              group GC
     *                  (admin) account A
     *              
     *  Then A is *allowed* for right R on target account U, because GC is more specific to A than GA and GB.
     *  Even if on the target side, grant on G3(grant to GA) and G2(grant to GB) is more specific than the 
     *  grant on G1(grant to GC).          
     * 
     * @param effectiveACLs
     * @param grantee
     * @param right
     * @param via
     * @param granteeFlags
     * @return
     * @throws ServiceException
     */
    private static Boolean checkGroup(List<EffectiveACL> effectiveACLs, Account grantee, Right right, ViaGrant via, short granteeFlags) throws ServiceException {
        
        EffectiveACL mostSpecificToGrantee_theTarget = null;
        ZimbraACE    mostSpecificToGrantee_theGrant = null;
        int          mostSpecificToGrantee_theDistance = -1;
        
        List<MemberOf> memberOf = Provisioning.getInstance().getAclGroups(grantee);
        
        for (EffectiveACL acl : effectiveACLs) {
            for (ZimbraACE ace : acl.getAces()) {
                GranteeType granteeType = ace.getGranteeType();
                if (!granteeType.hasFlags(granteeFlags))
                    continue;
                
                if (ace.matchesGrantee(grantee)) {
                    
                    int distance = -1;
                    String granteeId = ace.getGrantee();
                    for (MemberOf mo : memberOf) {
                        if (mo.getId().equals(granteeId)) {
                            distance = mo.getDistance();
                            break;
                        }
                    }
                    
                    // not really possible, since we've already passed the matchesGrantee test
                    if (distance == -1)
                        continue;  // log?
                    
                    if (mostSpecificToGrantee_theDistance == -1 ||
                        distance < mostSpecificToGrantee_theDistance ||
                        (distance == mostSpecificToGrantee_theDistance && ace.deny())) {
                        // found a more specific grant, or an ace with the same distance to 
                        // grantee but is a negative grant.
                        mostSpecificToGrantee_theTarget = acl;
                        mostSpecificToGrantee_theGrant = ace;
                        mostSpecificToGrantee_theDistance = distance;
                    }
                }
            }
        }
        
        if (mostSpecificToGrantee_theGrant == null)
            return null;  // nothing matched
        else
            return gotResult(mostSpecificToGrantee_theTarget, mostSpecificToGrantee_theGrant, 
                             grantee, right, via);
    }
    
    private static Boolean gotResult(EffectiveACL acl, ZimbraACE ace, Account grantee, Right right, ViaGrant via) {
        if (ace.deny()) {
            if (sLog.isDebugEnabled())
                sLog.debug("Right " + "[" + right.getName() + "]" + " DENIED to " + grantee.getName() + 
                           " via grant: " + ace.dump() + " on: " + acl.getGrantedOnEntry());
            if (via != null)
                via.setImpl(new ACEViaGrant(acl.getGrantedOnEntryType(),
                                            acl.mGrantedOnEntry,
                                            ace.getGranteeType(),
                                            ace.getGranteeDisplayName(),
                                            ace.getRight(),
                                            ace.deny()));
            return Boolean.FALSE;
        } else {
            if (sLog.isDebugEnabled())
                sLog.debug("Right " + "[" + right.getName() + "]" + " ALLOWED to " + grantee.getName() + 
                           " via grant: " + ace.dump() + " on: " + acl.getGrantedOnEntry());
            if (via != null)
                via.setImpl(new ACEViaGrant(acl.getGrantedOnEntryType(),
                                            acl.mGrantedOnEntry,
                                            ace.getGranteeType(),
                                            ace.getGranteeDisplayName(),
                                            ace.getRight(),
                                            ace.deny()));
            return Boolean.TRUE;
        }
    }
    
    
    private static int collectAttrs(List<EffectiveACL> effectiveACLs, String granteeId, int baseDistance,
                                    Map<String, Integer> allowSome, Map<String, Integer> denySome,
                                    List<Integer> allowAll, List<Integer> denyAll,
                                    Set<String> allowSomeWithLimit) throws ServiceException {
        
        int dist = baseDistance;
        
        for (EffectiveACL acl : effectiveACLs) {
            dist++;
            
            for (ZimbraACE ace : acl.getAces()) {
                dist++;
                Integer distance = Integer.valueOf(dist);
                
                if (ace.getGrantee().equals(granteeId)) {
                    // must be an AttrRight by now
                    AttrRight right = (AttrRight)ace.getRight();
                    if (right.allAttrs()) {
                        // all attrs
                        if (ace.deny())
                            denyAll.add(distance);
                        else
                            allowAll.add(distance);
                        
                    } else {
                        for (String attr : right.getAttrs()) {
                            // put the attr in the result list only if it had not appear yet in earlier
                            // iterations, since we are traversing from the most specific to the lest 
                            // specific.
                            if (ace.deny()) {
                                if (!denySome.containsKey(attr))
                                    denySome.put(attr, distance);
                            } else {
                                if (!allowSome.containsKey(attr))
                                    allowSome.put(attr, distance);
                                if (right.getAttrLimit(attr) == Boolean.TRUE)
                                    allowSomeWithLimit.add(attr);
                            }
                        }
                    }
                }
            }
        }
        
        return dist; // base distance for the next rank of grantee types
    }
    
    // dump a List of EffectiveACL as ({entry name on which the right is granted}: [grant] [grant] ...)
    private static String dump(List<EffectiveACL> effectiveACLs) {
        StringBuffer sb = new StringBuffer();
        for (EffectiveACL acl : effectiveACLs) {
            sb.append(acl.dump() + " ");
        }
        return sb.toString();
    }

    
    /**
     * @param args
     */
    public static void main(String[] args) {
        // TODO Auto-generated method stub

    }

}
