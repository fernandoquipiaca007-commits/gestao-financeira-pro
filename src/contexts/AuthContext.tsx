import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import { UserProfile, UserRole, PermissionScope, PermissionMap } from '../types/rbac';
import { buildPermissionMap, hasPermission as checkPerm, getVisibleTabs } from '../lib/permissions';

// ============================================================
// AuthContext Types
// ============================================================

interface AuthContextValue {
  // Session
  userSession: UserSession | null;
  userProfile: UserProfile | null;
  authLoading: boolean;

  // Permission helpers
  permissionMap: PermissionMap;
  hasPermission: (permissionId: string, scope?: PermissionScope) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  visibleTabs: string[];

  // Actions
  login: (session: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ============================================================
// AuthProvider
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissionMap, setPermissionMap] = useState<PermissionMap>(new Map());
  const [authLoading, setAuthLoading] = useState(true);

  // ------------------------------------------------------------------
  // Fetch profile + permissions from Supabase
  // ------------------------------------------------------------------
  const fetchProfileAndPermissions = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Fetch user_profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.warn('[Auth] user_profile not found for:', userId);
        return null;
      }

      const profile: UserProfile = {
        id: profileData.id,
        companyId: profileData.company_id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role as UserRole,
        status: profileData.status,
        avatarUrl: profileData.avatar_url || undefined,
        mustChangePassword: profileData.must_change_password || false,
        lastLoginAt: profileData.last_login_at || undefined,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };

      // Fetch user_permissions (overrides)
      const { data: permsData } = await supabase
        .from('user_permissions')
        .select('permission_id, scope, granted')
        .eq('user_id', userId);

      const overrides = (permsData || []).map((p) => ({
        permissionId: p.permission_id,
        scope: p.scope as PermissionScope,
        granted: p.granted,
      }));

      const map = buildPermissionMap(profile.role, overrides);
      setPermissionMap(map);
      setUserProfile(profile);

      // Update last_login_at
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

      return profile;
    } catch (err) {
      console.warn('[Auth] Error fetching profile:', err);
      return null;
    }
  }, []);

  // ------------------------------------------------------------------
  // Refresh profile (call after permission changes)
  // ------------------------------------------------------------------
  const refreshProfile = useCallback(async () => {
    if (!userSession?.id) return;
    await fetchProfileAndPermissions(userSession.id);
  }, [userSession?.id, fetchProfileAndPermissions]);

  // ------------------------------------------------------------------
  // Init — listen to Supabase auth state
  // ------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        const sess: UserSession = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Utilizador',
          token: session.access_token,
        };
        setUserSession(sess);
        await fetchProfileAndPermissions(session.user.id);
      }

      if (mounted) setAuthLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const sess: UserSession = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Utilizador',
          token: session.access_token,
        };
        setUserSession(sess);
        if (event === 'SIGNED_IN') {
          await fetchProfileAndPermissions(session.user.id);
        }
      } else {
        setUserSession(null);
        setUserProfile(null);
        setPermissionMap(new Map());
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndPermissions]);

  // ------------------------------------------------------------------
  // Login (called after successful Supabase auth)
  // ------------------------------------------------------------------
  const login = useCallback(async (session: UserSession) => {
    setUserSession(session);
    const profile = await fetchProfileAndPermissions(session.id);

    // Se não tem perfil ainda, pode ser primeiro login — o fluxo de setup
    // é tratado no LoginView ou App.tsx
    if (!profile) {
      console.warn('[Auth] No user_profile found after login. Setup may be required.');
    }
  }, [fetchProfileAndPermissions]);

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserSession(null);
    setUserProfile(null);
    setPermissionMap(new Map());
    // Limpar cache local
    ['gfo_clients_v1', 'gfo_projects_v1', 'gfo_incomes_v1', 'gfo_expenses_v1', 'gfo_partners_v1'].forEach(
      (key) => localStorage.removeItem(key)
    );
  }, []);

  // ------------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------------
  const role: UserRole = (userProfile?.role as UserRole) || 'employee';
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  const hasPermissionFn = useCallback(
    (permissionId: string, scope?: PermissionScope): boolean => {
      if (!userProfile) return false;
      if (userProfile.status !== 'active') return false;
      return checkPerm(role, permissionMap, permissionId, scope);
    },
    [userProfile, role, permissionMap]
  );

  const visibleTabs = userProfile
    ? getVisibleTabs(role, permissionMap)
    : [];

  // ------------------------------------------------------------------
  // Context Value
  // ------------------------------------------------------------------
  const value: AuthContextValue = {
    userSession,
    userProfile,
    authLoading,
    permissionMap,
    hasPermission: hasPermissionFn,
    isOwner,
    isAdmin,
    isEmployee,
    visibleTabs,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
