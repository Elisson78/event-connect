import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    try {
      console.log('Fetching user details for:', authUser.id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (userData) {
        console.log('User data found:', userData);
        const fullUser = { ...authUser, ...userData };
        setUser(fullUser);
        return fullUser;
      }

      if (userError && userError.code === 'PGRST116') {
        console.warn("User record not found in 'public.users'. Attempting to create it to fix data inconsistency.");
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            role: authUser.user_metadata?.role || 'participant',
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create missing user record:", insertError);
          const partialUser = { ...authUser, id: authUser.id, name: authUser.user_metadata?.name || authUser.email, role: authUser.user_metadata?.role, is_partial: true };
          setUser(partialUser);
          return partialUser;
        }

        console.log("Successfully created missing user record:", newUser);
        const fullUser = { ...authUser, ...newUser };
        setUser(fullUser);
        return fullUser;
      }
      
      if (userError) {
        throw userError;
      }

    } catch (error) {
      console.error("Unexpected error in fetchUserDetails:", error);
      const fallbackUser = { 
        ...authUser, 
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email,
        role: authUser.user_metadata?.role,
        is_fallback: true
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  // Garante que o usuário existe na tabela users
  const ensureUserInUsersTable = async (authUser) => {
    if (!authUser?.id) return;
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();
    if (!userExists) {
      await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        role: authUser.user_metadata?.role || 'participant',
      });
    }
  };

  useEffect(() => {
    const fetchInitialUser = async () => {
      setLoading(true);
      try {
        console.log('AuthContext - Fetching initial user session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthContext - Error getting session:", error.message);
        } else if (session?.user) {
          console.log('AuthContext - Session found, user:', session.user);
          await fetchUserDetails(session.user);
        } else {
          console.log('AuthContext - No session found');
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext - Error in fetchInitialUser:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      try {
        if (session?.user) {
          await fetchUserDetails(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in onAuthStateChange:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Supabase login error:", error);
        throw error; 
      }

      if (!data.user) {
        throw new Error("Falha no login: usuário não retornado.");
      }
      
      await ensureUserInUsersTable(data.user); // <-- Garante usuário na tabela
      return await fetchUserDetails(data.user);
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, 
            role: role  
          }
        }
      });

      if (error) {
        console.error("Supabase signUp error:", error);
        throw error;
      }
      
      if (!data.user) {
        console.error("Supabase signUp did not return a user object:", data);
        throw new Error("Falha no registro: usuário não retornado.");
      }

      await ensureUserInUsersTable(data.user); // <-- Garante usuário na tabela

      if (role === 'participant') {
        let participantCode;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          participantCode = Math.floor(100000 + Math.random() * 900000);
          
          const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('participant_code', participantCode);
          
          if (checkError) {
             console.error('Error checking for unique code:', checkError);
             break;
          }

          if (existingUsers && existingUsers.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (isUnique) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ participant_code: participantCode })
            .eq('auth_id', data.user.id);

          if (updateError) {
            console.error("Failed to set participant code:", updateError);
          }
        } else {
          console.error("Could not generate a unique participant code after 10 attempts.");
        }
      }
      
      return await fetchUserDetails(data.user); 
    } catch (error) {
      console.error("Register error in AuthContext:", error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    signOut,
    register,
    loading,
    fetchUserDetails
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};