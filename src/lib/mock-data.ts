// Mock data for demo mode

export const MOCK_USERS = [
  { user_id: "u1", username: "Admin Principal", email: "admin@docuflow.fr", is_active: true, group_id: "g1", role: "admin" },
  { user_id: "u2", username: "Marie Dupont", email: "marie.dupont@docuflow.fr", is_active: true, group_id: "g1", role: "editor" },
  { user_id: "u3", username: "Jean Martin", email: "jean.martin@docuflow.fr", is_active: true, group_id: "g2", role: "editor" },
  { user_id: "u4", username: "Sophie Bernard", email: "sophie.bernard@docuflow.fr", is_active: true, group_id: "g3", role: "reader" },
  { user_id: "u5", username: "Lucas Moreau", email: "lucas.moreau@docuflow.fr", is_active: false, group_id: "g2", role: "reader" },
];

export const MOCK_GROUPS = [
  { id: "g1", name: "Comptabilité", icon: "Calculator", description: "Service comptabilité et finances", parent_id: null, created_at: "2026-01-15T10:00:00Z" },
  { id: "g2", name: "Ressources Humaines", icon: "Users", description: "Gestion du personnel", parent_id: null, created_at: "2026-01-15T10:00:00Z" },
  { id: "g3", name: "Direction", icon: "Building2", description: "Direction générale", parent_id: null, created_at: "2026-01-15T10:00:00Z" },
  { id: "g4", name: "Paie", icon: "Wallet", description: "Sous-service paie", parent_id: "g1", created_at: "2026-02-01T10:00:00Z" },
  { id: "g5", name: "Recrutement", icon: "UserPlus", description: "Sous-service recrutement", parent_id: "g2", created_at: "2026-02-01T10:00:00Z" },
];

export const MOCK_PERMISSIONS = [
  { user_id: "u2", group_id: "g2", permission: "R" },
  { user_id: "u2", group_id: "g3", permission: "RU" },
  { user_id: "u3", group_id: "g1", permission: "CR" },
  { user_id: "u4", group_id: "g1", permission: "R" },
  { user_id: "u4", group_id: "g2", permission: "R" },
];

export const MOCK_AUDIT_LOGS = [
  { id: "a1", user_name: "Admin Principal", action: "Connexion", target: null, ip_address: "192.168.1.10", created_at: "2026-03-26T08:00:00Z" },
  { id: "a2", user_name: "Admin Principal", action: "Création", target: "Groupe: Comptabilité", ip_address: "192.168.1.10", created_at: "2026-03-25T14:30:00Z" },
  { id: "a3", user_name: "Marie Dupont", action: "Upload", target: "Rapport_Q1_2026.pdf", ip_address: "192.168.1.22", created_at: "2026-03-25T11:00:00Z" },
  { id: "a4", user_name: "Jean Martin", action: "Modification", target: "Contrat_CDI_Martin.docx", ip_address: "192.168.1.35", created_at: "2026-03-24T16:45:00Z" },
  { id: "a5", user_name: "Admin Principal", action: "Suppression", target: "Ancien_rapport.pdf", ip_address: "192.168.1.10", created_at: "2026-03-24T09:15:00Z" },
  { id: "a6", user_name: "Sophie Bernard", action: "Connexion", target: null, ip_address: "192.168.1.42", created_at: "2026-03-23T08:30:00Z" },
  { id: "a7", user_name: "Admin Principal", action: "Inscription", target: "lucas.moreau@docuflow.fr", ip_address: "192.168.1.10", created_at: "2026-03-22T10:00:00Z" },
];
