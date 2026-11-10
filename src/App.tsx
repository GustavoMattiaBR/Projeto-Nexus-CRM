/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ContactModal } from './components/ContactModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SqlModal } from './components/SqlModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { Contact, ContactFormData } from './types/crm';
import {
  getSupabaseClient,
  getStoredSupabaseConfig,
  getLocalUser,
  setLocalUser,
  crmService,
} from './lib/supabase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Check auth and connection
  const checkAuth = useCallback(async () => {
    setIsAuthChecking(true);
    const { isConfigured } = getStoredSupabaseConfig();
    setIsSupabaseConnected(isConfigured);

    const client = getSupabaseClient();
    if (client && isConfigured) {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || 'usuario@empresa.com',
          });
        } else {
          // If no session on configured supabase, check local fallback
          const local = getLocalUser();
          setCurrentUser(local);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão Supabase:', err);
        const local = getLocalUser();
        setCurrentUser(local);
      }
    } else {
      // Offline / Local preview mode
      const local = getLocalUser();
      setCurrentUser(local);
    }
    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen to Supabase auth events if connected
    const client = getSupabaseClient();
    if (client) {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || 'usuario@empresa.com',
          });
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [checkAuth]);

  // Load contacts whenever user is available
  const loadContacts = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingContacts(true);
    const { data, error } = await crmService.fetchContacts(currentUser.id);
    if (error) {
      console.warn('Aviso ao carregar contatos:', error);
    }
    setContacts(data || []);
    setIsLoadingContacts(false);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadContacts();
    } else {
      setContacts([]);
    }
  }, [currentUser, loadContacts]);

  // Handle Logout
  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error('Erro ao deslogar do Supabase:', e);
      }
    }
    setLocalUser(null);
    setCurrentUser(null);
    showToast('Você encerrou a sessão com sucesso.');
  };

  // Handle Create / Edit Contact
  const handleSaveContact = async (formData: ContactFormData): Promise<boolean> => {
    if (!currentUser) return false;

    if (contactToEdit) {
      // Update
      const { data, error } = await crmService.updateContact(contactToEdit.id, formData);
      if (error) {
        throw new Error(error);
      }
      if (data) {
        setContacts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        showToast('Contato atualizado com sucesso!');
        return true;
      }
    } else {
      // Create
      const { data, error } = await crmService.createContact(currentUser.id, formData);
      if (error) {
        throw new Error(error);
      }
      if (data) {
        setContacts((prev) => [data, ...prev]);
        showToast('Novo contato cadastrado com sucesso!');
        return true;
      }
    }
    return false;
  };

  // Handle Delete Contact
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);

    const { success, error } = await crmService.deleteContact(contactToDelete.id);
    if (!success || error) {
      showToast(error || 'Erro ao remover o contato.');
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      showToast('Contato excluído com sucesso.');
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Carregando Nexus CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!currentUser ? (
        <AuthScreen
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            showToast(`Bem-vindo, ${user.email}!`);
          }}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
        />
      ) : (
        <Dashboard
          user={currentUser}
          contacts={contacts}
          isLoading={isLoadingContacts}
          onRefresh={loadContacts}
          onOpenCreateModal={() => {
            setContactToEdit(null);
            setIsContactModalOpen(true);
          }}
          onOpenEditModal={(contact) => {
            setContactToEdit(contact);
            setIsContactModalOpen(true);
          }}
          onOpenDeleteModal={(contact) => {
            setContactToDelete(contact);
            setIsDeleteModalOpen(true);
          }}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onLogout={handleLogout}
          isSupabaseConnected={isSupabaseConnected}
          toastMessage={toastMessage}
        />
      )}

      {/* Contact Create / Edit Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setContactToEdit(null);
        }}
        onSave={handleSaveContact}
        contactToEdit={contactToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContactToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        contact={contactToDelete}
        isDeleting={isDeleting}
      />

      {/* SQL Migration Modal */}
      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={() => {
          checkAuth();
          showToast('Credenciais atualizadas.');
        }}
      />
    </>
  );
}
