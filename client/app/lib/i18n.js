export const localeCycle = ['en', 'fr']

export function getNextLocale(locale) {
  const currentIndex = localeCycle.indexOf(locale)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  return localeCycle[(safeIndex + 1) % localeCycle.length]
}

export function getLocaleButtonLabel(locale) {
  const next = getNextLocale(locale)
  const labels = { en: 'EN', fr: 'FR' }
  return labels[next] || 'EN'
}

export function getIntlLocale(locale) {
  if (locale === 'fr') return 'fr-FR'
  return 'en-US'
}

export const i18n = {
  en: {
    appName: 'Pharmacy Manager',
    pages: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      agenda: 'Agenda',
      users: 'Users',
      subscription: 'Subscription',
      pendingInvitations: 'Pending Invitations'
    },
    sidebar: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      agenda: 'Agenda',
      users: 'Users',
      subscription: 'Subscription'
    },
    auth: {
      name: 'Name',
      email: 'Email',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'you@pharmacy.local'
    },
    authPage: {
      signIn: 'Sign in',
      helper: 'Use your Google account to access Pharmacy Manager.',
      cta: 'Continue with Google',
      loading: 'Signing you in...',
      failed: 'Google sign-in failed. Please try again.'
    },
    topbar: {
      workspace: 'Workspace',
      roleAdmin: 'ADMIN',
      roleWorker: 'WORKER',
      confirmSignOut: 'Are you sure you want to sign out?'
    },
    dashboard: {
      stats: [
        { id: 'total', label: 'Total Orders', delta: 'Live' },
        { id: 'due', label: 'Due Today', delta: 'Need review' },
        { id: 'arrived', label: 'Arrived', delta: 'Completed' },
        { id: 'urgent', label: 'Urgent', delta: 'Prioritize first' }
      ]
    },
    invitations: {
      title: 'Workspace Invitations',
      from: 'From',
      accept: 'Accept',
      decline: 'Decline',
      confirmTitle: 'Please confirm',
      confirmAccept: 'Accept invitation?',
      confirmDecline: 'Decline invitation?',
      confirmYes: 'Yes',
      confirmNo: 'Cancel'
    },
    pendingInvitationsPage: {
      emptyTitle: 'No pending invitations',
      emptyText: 'Ask an owner to invite you to a pharmacy.',
      roleLabel: 'Role',
      accept: 'Accept Invitation'
    },
    onboarding: {
      label: 'Onboarding',
      title: 'Choose your role',
      text: 'Select how you will use this workspace.',
      owner: 'I am an Owner',
      pharmacist: 'I am a Pharmacist'
    },
    orders: {
      addTitle: 'Add New Order',
      addDescription:
        'Capture patient, product and delivery details. New orders appear first.',
      fields: {
        patientName: 'Patient Name',
        phone: 'Phone',
        productName: 'Medication / Product Name',
        comment: 'Comment',
        arrivalDate: 'Approximate Arrival Date',
        urgency: 'Urgency'
      },
      placeholders: {
        patientName: 'Patient full name',
        phone: '0550 00 00 00',
        productName: 'Medication or product',
        comment: 'Initial order note'
      },
      urgency: {
        Urgent: 'Urgent',
        Normal: 'Normal'
      },
      addButton: 'Add Order',
      searchLabel: 'Search Orders',
      searchPlaceholder:
        'Search by medication/product, patient name, or phone number',
      remindersTitle: 'Arrival Date Reminders',
      remindersEmpty: 'No reminders right now.',
      remindersText:
        'This order reached its planned date. Update the current status.',
      reminderActions: {
        arrived: 'Arrived',
        ordered: 'Ordered',
        notYet: 'Not Yet'
      },
      tableTitle: 'Orders List',
      columns: {
        id: 'Order ID',
        patient: 'Patient',
        phone: 'Phone',
        product: 'Medication/Product',
        arrivalDate: 'Approx. Arrival',
        urgency: 'Urgency',
        status: 'Status',
        comments: 'Comments'
      },
      openDetails: 'Open',
      statusLabel: 'Set status',
      status: {
        'Not Yet': 'Not Yet',
        Ordered: 'Ordered',
        Arrived: 'Arrived'
      },
      commentPlaceholder: 'Add a comment',
      addComment: 'Post',
      noComments: 'No comments yet.',
      detailsTitle: 'Order Details',
      backToOrders: 'Back to Orders',
      saveChanges: 'Save Changes',
      notFound: 'Order not found.'
    },
    agenda: {
      monthHint:
        'Monthly view. Drag an order card to another day to update arrival date.',
      today: 'Today',
      noOrders: 'No orders'
    },
    users: {
      inviteWorker: 'Invite Worker',
      invitePlaceholder: 'worker@pharmacy.local',
      sendInvite: 'Send Invite',
      teamMembers: 'Team Members',
      pendingInvites: 'Pending Invites',
      invitedBy: 'Invited by',
      inviteRoles: {
        pharmacist: 'Pharmacist',
        admin: 'Admin'
      },
      columns: {
        name: 'Name',
        role: 'Role',
        email: 'Email',
        status: 'Status'
      },
      role: {
        owner: 'Owner',
        admin: 'Admin',
        pharmacist: 'Pharmacist',
        worker: 'Worker',
        Worker: 'Worker'
      },
      active: 'Active'
    },
    subscription: {
      required: 'Subscription Required',
      unlock: 'Activate a plan to unlock admin features',
      signedInAs: 'Signed in as',
      mockBilling: 'This is an MVP placeholder flow for billing.',
      upTo5Workers: 'Up to 5 workers',
      upTo15Workers: 'Up to 15 workers',
      features: ['Orders dashboard', 'Agenda drag and drop', 'Team management'],
      choose: 'Choose',
      active: 'Subscription Active',
      pharmacyTitle: 'Create your pharmacy',
      pharmacyText: 'Set a pharmacy dashboard name to complete owner onboarding.',
      pharmacyPlaceholder: 'My Pharmacy',
      createPharmacy: 'Create Pharmacy'
    },
    subscriptionPreview: {
      mode: 'Preview Mode',
      title: 'Subscription page is accessible',
      text: 'You are viewing subscription UI preview. To use activation flow, login as an unsubscribed admin.',
      goToLogin: 'Go to Login',
      openDashboard: 'Open Dashboard'
    }
  },
  fr: {
    appName: 'Gestion Pharmacie',
    pages: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      agenda: 'Agenda',
      users: 'Utilisateurs',
      subscription: 'Abonnement',
      pendingInvitations: 'Invitations en attente'
    },
    sidebar: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      agenda: 'Agenda',
      users: 'Utilisateurs',
      subscription: 'Abonnement'
    },
    auth: {
      name: 'Nom',
      email: 'E-mail',
      namePlaceholder: 'Votre nom',
      emailPlaceholder: 'vous@pharmacie.local'
    },
    authPage: {
      signIn: 'Connexion',
      helper: 'Utilisez votre compte Google pour accéder à Pharmacy Manager.',
      cta: 'Continuer avec Google',
      loading: 'Connexion en cours...',
      failed: 'Échec de la connexion Google. Veuillez réessayer.'
    },
    topbar: {
      workspace: 'Espace',
      roleAdmin: 'ADMIN',
      roleWorker: 'PHARMACIEN',
      confirmSignOut: 'Voulez-vous vraiment vous déconnecter ?'
    },
    dashboard: {
      stats: [
        { id: 'total', label: 'Total des commandes', delta: 'En direct' },
        { id: 'due', label: 'À traiter aujourd’hui', delta: 'À vérifier' },
        { id: 'arrived', label: 'Arrivées', delta: 'Finalisées' },
        { id: 'urgent', label: 'Urgentes', delta: 'Priorité élevée' }
      ]
    },
    invitations: {
      title: 'Invitations de l’espace',
      from: 'De',
      accept: 'Accepter',
      decline: 'Refuser',
      confirmTitle: 'Veuillez confirmer',
      confirmAccept: 'Accepter l’invitation ?',
      confirmDecline: 'Refuser l’invitation ?',
      confirmYes: 'Oui',
      confirmNo: 'Annuler'
    },
    pendingInvitationsPage: {
      emptyTitle: 'Aucune invitation en attente',
      emptyText: 'Demandez au propriétaire de vous inviter à une pharmacie.',
      roleLabel: 'Rôle',
      accept: 'Accepter l’invitation'
    },
    onboarding: {
      label: 'Intégration',
      title: 'Choisissez votre rôle',
      text: 'Sélectionnez la manière dont vous utiliserez cet espace.',
      owner: 'Je suis propriétaire',
      pharmacist: 'Je suis pharmacien'
    },
    orders: {
      addTitle: 'Ajouter une commande',
      addDescription:
        'Saisissez le patient, le produit et la date de livraison. Les nouvelles commandes apparaissent en premier.',
      fields: {
        patientName: 'Nom du patient',
        phone: 'Téléphone',
        productName: 'Nom du médicament / produit',
        comment: 'Commentaire',
        arrivalDate: 'Date d’arrivée estimée',
        urgency: 'Urgence'
      },
      placeholders: {
        patientName: 'Nom complet du patient',
        phone: '0550 00 00 00',
        productName: 'Médicament ou produit',
        comment: 'Note initiale de commande'
      },
      urgency: {
        Urgent: 'Urgente',
        Normal: 'Normale'
      },
      addButton: 'Ajouter',
      searchLabel: 'Rechercher des commandes',
      searchPlaceholder:
        'Rechercher par médicament/produit, patient ou téléphone',
      remindersTitle: 'Rappels de date d’arrivée',
      remindersEmpty: 'Aucun rappel pour le moment.',
      remindersText:
        'Cette commande a atteint sa date prévue. Mettez à jour son statut.',
      reminderActions: {
        arrived: 'Arrivée',
        ordered: 'Commandée',
        notYet: 'Pas encore'
      },
      tableTitle: 'Liste des commandes',
      columns: {
        id: 'ID commande',
        patient: 'Patient',
        phone: 'Téléphone',
        product: 'Médicament/Produit',
        arrivalDate: 'Arrivée estimée',
        urgency: 'Urgence',
        status: 'Statut',
        comments: 'Commentaires'
      },
      openDetails: 'Ouvrir',
      statusLabel: 'Définir le statut',
      status: {
        'Not Yet': 'Pas encore',
        Ordered: 'Commandée',
        Arrived: 'Arrivée'
      },
      commentPlaceholder: 'Ajouter un commentaire',
      addComment: 'Publier',
      noComments: 'Aucun commentaire.',
      detailsTitle: 'Détails de la commande',
      backToOrders: 'Retour aux commandes',
      saveChanges: 'Enregistrer',
      notFound: 'Commande introuvable.'
    },
    agenda: {
      monthHint:
        'Vue mensuelle. Glissez une commande vers un autre jour pour modifier la date d’arrivée.',
      today: 'Aujourd’hui',
      noOrders: 'Aucune commande'
    },
    users: {
      inviteWorker: 'Inviter un membre',
      invitePlaceholder: 'pharmacien@pharmacie.local',
      sendInvite: 'Envoyer',
      teamMembers: 'Membres de l’équipe',
      pendingInvites: 'Invitations en attente',
      invitedBy: 'Invité par',
      inviteRoles: {
        pharmacist: 'Pharmacien',
        admin: 'Administrateur'
      },
      columns: {
        name: 'Nom',
        role: 'Rôle',
        email: 'E-mail',
        status: 'Statut'
      },
      role: {
        owner: 'Propriétaire',
        admin: 'Administrateur',
        pharmacist: 'Pharmacien',
        worker: 'Pharmacien',
        Worker: 'Pharmacien'
      },
      active: 'Actif'
    },
    subscription: {
      required: 'Abonnement requis',
      unlock: 'Activez un plan pour débloquer les fonctionnalités administrateur',
      signedInAs: 'Connecté en tant que',
      mockBilling: 'Ceci est un flux MVP temporaire pour la facturation.',
      upTo5Workers: 'Jusqu’à 5 membres',
      upTo15Workers: 'Jusqu’à 15 membres',
      features: [
        'Tableau des commandes',
        'Agenda avec glisser-déposer',
        'Gestion de l’équipe'
      ],
      choose: 'Choisir',
      active: 'Abonnement actif',
      pharmacyTitle: 'Créez votre pharmacie',
      pharmacyText:
        'Définissez le nom du tableau de bord de votre pharmacie pour terminer l’intégration propriétaire.',
      pharmacyPlaceholder: 'Ma Pharmacie',
      createPharmacy: 'Créer la pharmacie'
    },
    subscriptionPreview: {
      mode: 'Mode aperçu',
      title: 'La page abonnement est accessible',
      text: 'Vous visualisez l’aperçu de l’interface. Pour activer un plan, connectez-vous comme administrateur sans abonnement.',
      goToLogin: 'Aller à la connexion',
      openDashboard: 'Ouvrir le tableau de bord'
    }
  },
}

export function getCopy(locale) {
  return i18n[locale] || i18n.en
}

