export const i18n = {
  en: {
    appName: 'Pharmacy Manager',
    pages: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      agenda: 'Agenda',
      users: 'Users',
      subscription: 'Subscription'
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
    topbar: {
      workspace: 'Workspace'
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
      columns: {
        name: 'Name',
        role: 'Role',
        email: 'Email',
        status: 'Status'
      },
      role: {
        Worker: 'Worker'
      },
      active: 'Active'
    },
    subscription: {
      required: 'Subscription Required',
      unlock: 'Activate a plan to unlock admin features',
      signedInAs: 'Signed in as',
      mockBilling: 'This is a mock billing flow for UI testing.',
      upTo5Workers: 'Up to 5 workers',
      upTo15Workers: 'Up to 15 workers',
      features: ['Orders dashboard', 'Agenda drag and drop', 'Team management'],
      choose: 'Choose'
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
    appName: 'Pharmacy Manager',
    pages: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      agenda: 'Agenda',
      users: 'Utilisateurs',
      subscription: 'Abonnement'
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
      email: 'Email',
      namePlaceholder: 'Votre nom',
      emailPlaceholder: 'vous@pharmacy.local'
    },
    topbar: {
      workspace: 'Espace'
    },
    dashboard: {
      stats: [
        { id: 'total', label: 'Total commandes', delta: 'Temps reel' },
        { id: 'due', label: 'Prevues aujourd hui', delta: 'A verifier' },
        { id: 'arrived', label: 'Arrivees', delta: 'Completees' },
        { id: 'urgent', label: 'Urgentes', delta: 'A traiter en priorite' }
      ]
    },
    invitations: {
      title: 'Invitations espace de travail',
      from: 'De',
      accept: 'Accepter',
      decline: 'Refuser',
      confirmTitle: 'Veuillez confirmer',
      confirmAccept: 'Accepter invitation ?',
      confirmDecline: 'Refuser invitation ?',
      confirmYes: 'Oui',
      confirmNo: 'Annuler'
    },
    orders: {
      addTitle: 'Ajouter une commande',
      addDescription:
        'Saisissez le patient, le produit et la date d arrivee. Les nouvelles commandes apparaissent en premier.',
      fields: {
        patientName: 'Nom du patient',
        phone: 'Telephone',
        productName: 'Nom du medicament / produit',
        comment: 'Commentaire',
        arrivalDate: 'Date arrivee approximative',
        urgency: 'Urgence'
      },
      placeholders: {
        patientName: 'Nom complet du patient',
        phone: '0550 00 00 00',
        productName: 'Medicament ou produit',
        comment: 'Note initiale de commande'
      },
      urgency: {
        Urgent: 'Urgente',
        Normal: 'Normale'
      },
      addButton: 'Ajouter commande',
      searchLabel: 'Rechercher une commande',
      searchPlaceholder:
        'Rechercher par medicament/produit, nom du patient ou telephone',
      remindersTitle: 'Rappels date d arrivee',
      remindersEmpty: 'Aucun rappel pour le moment.',
      remindersText:
        'Cette commande a atteint sa date prevue. Mettez a jour son statut.',
      reminderActions: {
        arrived: 'Arrivee',
        ordered: 'Commandee',
        notYet: 'Pas encore'
      },
      tableTitle: 'Liste des commandes',
      columns: {
        id: 'ID Commande',
        patient: 'Patient',
        phone: 'Telephone',
        product: 'Medicament/Produit',
        arrivalDate: 'Arrivee approx.',
        urgency: 'Urgence',
        status: 'Statut',
        comments: 'Commentaires'
      },
      openDetails: 'Ouvrir',
      statusLabel: 'Changer statut',
      status: {
        'Not Yet': 'Pas encore',
        Ordered: 'Commandee',
        Arrived: 'Arrivee'
      },
      commentPlaceholder: 'Ajouter un commentaire',
      addComment: 'Publier',
      noComments: 'Aucun commentaire.',
      detailsTitle: 'Details commande',
      backToOrders: 'Retour aux commandes',
      saveChanges: 'Enregistrer modifications',
      notFound: 'Commande introuvable.'
    },
    agenda: {
      monthHint:
        'Vue mensuelle. Glissez une carte commande vers un autre jour pour modifier la date arrivee.',
      today: 'Aujourd hui',
      noOrders: 'Aucune commande'
    },
    users: {
      inviteWorker: 'Inviter un worker',
      invitePlaceholder: 'worker@pharmacy.local',
      sendInvite: 'Envoyer invitation',
      teamMembers: 'Membres de l equipe',
      pendingInvites: 'Invitations en attente',
      invitedBy: 'Invite par',
      columns: {
        name: 'Nom',
        role: 'Role',
        email: 'Email',
        status: 'Statut'
      },
      role: {
        Worker: 'Worker'
      },
      active: 'Actif'
    },
    subscription: {
      required: 'Abonnement requis',
      unlock: 'Activez un plan pour debloquer les fonctions admin',
      signedInAs: 'Connecte en tant que',
      mockBilling: 'Ceci est un flux de paiement mock pour tester l interface.',
      upTo5Workers: 'Jusqu a 5 workers',
      upTo15Workers: 'Jusqu a 15 workers',
      features: [
        'Tableau des commandes',
        'Agenda avec glisser deposer',
        'Gestion de l equipe'
      ],
      choose: 'Choisir'
    },
    subscriptionPreview: {
      mode: 'Mode apercu',
      title: 'La page abonnement est accessible',
      text: 'Vous visualisez l apercu UI. Pour activer un plan, connectez vous comme admin sans abonnement.',
      goToLogin: 'Aller a la connexion',
      openDashboard: 'Ouvrir tableau de bord'
    }
  }
}

export function getCopy(locale) {
  return i18n[locale] || i18n.en
}
