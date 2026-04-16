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

export function formatShortDate(dateValue, locale) {
  if (!dateValue) return ''
  const safeValue = String(dateValue).trim()
  const date = new Date(`${safeValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return safeValue

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).format(date)
}

export const i18n = {
  en: {
    appName: 'Phlow it',
    pages: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      tasks: 'Tasks',
      preparations: 'Preparations',
      inbody: 'InBody',
      agenda: 'Agenda',
      activity: 'Activity Logs',
      superadmin: 'Super Admin',
      users: 'Users',
      subscription: 'Subscription',
      pendingInvitations: 'Pending Invitations'
    },
    sidebar: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      tasks: 'Tasks',
      preparations: 'Preparations',
      inbody: 'InBody',
      agenda: 'Agenda',
      activity: 'Activity',
      superadminDashboard: 'Superadmin',
      superadminPharmacies: 'Pharmacies',
      superadminUsers: 'Users',
      superadminActivity: 'Activity Logs',
      users: 'Users',
      subscription: 'Subscription',
      pendingInvitations: 'Invitations'
    },
    auth: {
      name: 'Name',
      email: 'Email',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'you@pharmacy.local'
    },
    authPage: {
      signIn: 'Sign in',
      helper: 'Use your Google account to sign in as pharmacy owner.',
      cta: 'Continue with Google',
      loading: 'Signing you in...',
      failed: 'Google sign-in failed. Please try again.'
    },
    topbar: {
      workspace: 'Workspace',
      roleSuperadmin: 'SUPERADMIN',
      roleOwner: 'OWNER',
      roleAdmin: 'ADMIN',
      roleWorker: 'WORKER',
      confirmSignOutTitle: 'Sign out',
      confirmSignOut: 'Are you sure you want to sign out?',
      confirmYes: 'Sign out',
      confirmNo: 'Cancel'
    },
    dashboard: {
      sideInfoTitle: 'Pharmacy Side Info',
      pharmacyName: 'Pharmacy name',
      pharmacySlug: 'Pharmacy slug',
      ownerEmail: 'Owner email',
      staffCount: 'Staff count',
      noWorkspace: 'Dashboard',
      noSlug: 'No slug',
      stats: [
        { id: 'finished', label: 'Finished Orders', delta: 'Archived' },
        { id: 'due', label: 'Due Today', delta: 'Need review' },
        { id: 'arrived', label: 'Arrived', delta: 'At pharmacy' },
        { id: 'ordered', label: 'Ordered', delta: 'In progress' },
        { id: 'waiting', label: 'Waiting', delta: 'Pending' },
        { id: 'completed', label: 'Completed', delta: 'Arrived + finished' },
        { id: 'total', label: 'Total', delta: 'All orders' }
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
      accept: 'Accept Invitation',
      noWorkspaceTitle: 'No workspace yet',
      noWorkspaceText:
        'You cannot access dashboards until an owner invites you to a pharmacy.',
      funHeader: 'While waiting, quick pharmacy trivia',
      funFacts: [
        'Pharmacies are one of the oldest continuously regulated professions.',
        'A clear stock workflow usually cuts urgent order delays dramatically.',
        'Short handoff notes between pharmacists reduce follow-up calls.'
      ],
      workspaceReadyTitle: 'You are already connected to a workspace',
      workspaceReadyText:
        'Use the sidebar to jump to your dashboard, orders, and agenda anytime.',
      goDashboard: 'Open Dashboard'
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
        products: 'Products',
        comment: 'Comment',
        category: 'Category',
        arrivalDate: 'Approximate Arrival Date',
        versement: 'Versement'
      },
      placeholders: {
        patientName: 'Patient full name',
        phone: '0550 00 00 00',
        products: 'Example: Amoxicillin 500mg, Vitamin C',
        comment: 'Initial order note',
        versement: '0.00'
      },
      validation: {
        patientNameRequired: 'Patient name is required.',
        phoneRequired: 'Phone is required.',
        productsRequired: 'At least one product is required.',
        versementInvalid: 'Versement must be a non-negative number.'
      },
      addArrivalDate: 'Add arrival date',
      removeArrivalDate: 'Remove arrival date',
      categoryFilterLabel: 'Filter by category',
      allCategories: 'All categories',
      requiredFieldsTitle: 'Mandatory fields',
      requiredFieldsText: 'Patient, product/medication, and phone number are required.',
      optionalFieldsTitle: 'Optional fields',
      optionalFieldsText: 'Arrival date, deposit, and note can be added if needed.',
      noArrivalDate: 'To be scheduled',
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
        called: 'Called',
        finished: 'Finished',
        ordered: 'Ordered',
        pending: 'Pending'
      },
      tableTitle: 'Active Orders',
      finishedTableTitle: 'Finished Orders',
      finishedEmpty: 'No finished orders yet.',
      showFinished: 'Show Finished Orders',
      hideFinished: 'Hide Finished Orders',
      columns: {
        id: 'Order ID',
        patient: 'Patient',
        phone: 'Phone',
        products: 'Products',
        category: 'Category',
        addedBy: 'Added by',
        arrivalDate: 'Approx. Arrival',
        versement: 'Versement',
        status: 'Status',
        comments: 'Comments',
        actions: 'Actions'
      },
      statusLabel: 'Set status',
      status: {
        pending: 'Pending',
        ordered: 'Ordered',
        called: 'Called',
        arrived: 'Arrived',
        finished: 'Finished'
      },
      categories: {
        general: 'General',
        orthopedie: 'Orthopedie',
        caba: 'Caba',
        medicament: 'Medicament',
        parapharmacie: 'Parapharmacie',
        'dermo-cosmetique': 'Dermo-cosmetique'
      },
      commentPlaceholder: 'Add a comment',
      addComment: 'Post',
      actionHistory: 'Order Activity',
      noActions: 'No order activity yet.',
      createdByLabel: 'Added by',
      createdAtLabel: 'Created',
      deleteOrderLabel: 'Delete order',
      deleteCommentLabel: 'Delete comment',
      confirmDeleteOrderTitle: 'Delete this order?',
      confirmDeleteOrderMessage: 'This order and its comments will be removed permanently.',
      confirmDeleteCommentTitle: 'Delete this comment?',
      confirmDeleteCommentMessage: 'This comment will be removed permanently.',
      confirmDelete: 'Delete',
      cancelDelete: 'Cancel',
      noComments: 'No comments yet.',
      detailsTitle: 'Order Details',
      backToOrders: 'Back to Orders',
      saveChanges: 'Save Changes',
      notFound: 'Order not found.',
      actionLabels: {
        CREATE_ORDER: 'Order created',
        UPDATE_ORDER: 'Order updated',
        UPDATE_STATUS: 'Status updated',
        ADD_ORDER_COMMENT: 'Comment added',
        DELETE_ORDER_COMMENT: 'Comment deleted',
        DELETE_ORDER: 'Order deleted'
      }
    },
    tasks: {
      addTitle: 'Create a task',
      addDescription:
        'Capture pending pharmacy actions for the team and keep follow-up visible.',
      fields: {
        type: 'Task type',
        customTypeLabel: 'Custom task label',
        comment: 'Comment / Details',
        patientName: 'Patient name',
        phone: 'Phone',
        createdBy: 'Created by'
      },
      placeholders: {
        customTypeLabel: 'Example: Return supplier call',
        comment: 'Useful context for the next team member',
        patientName: 'Patient full name',
        phone: '0550 00 00 00',
        search: 'Search by task, details, patient, or phone',
        commentInput: 'Add a follow-up comment'
      },
      validation: {
        typeRequired: 'Task type is required.',
        customTypeLabelRequired: 'Custom task label is required.',
        phoneInvalid: 'Phone must contain digits only.'
      },
      recommendedHint: 'Optional but useful for smoother handoffs.',
      addButton: 'Add task',
      tabs: {
        all: 'All',
        pending: 'Pending',
        done: 'Completed'
      },
      filters: {
        searchLabel: 'Search',
        typeLabel: 'Filter by type',
        statusLabel: 'Filter by status',
        allTypes: 'All types',
        allStatuses: 'All statuses'
      },
      status: {
        pending: 'Pending',
        done: 'Completed'
      },
      typeLabels: {
        ordonnance: 'Ordonnance à faire passer',
        instance: 'Instance',
        patient_appel: 'Patient à appeler',
        autres: 'Autres'
      },
      meta: {
        createdAt: 'Created',
        updatedAt: 'Updated',
        completedAt: 'Completed',
        completedBy: 'Completed by',
        patient: 'Patient',
        phone: 'Phone',
        comments: 'Comments'
      },
      actions: {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        addComment: 'Post',
        comments: 'Comments',
        hideComments: 'Hide comments'
      },
      empty: {
        pending: 'No pending tasks.',
        done: 'No completed tasks.',
        all: 'No tasks yet.',
        filtered: 'No tasks match the current filters.',
        helper: 'Create the first task to help your team stay aligned.'
      },
      confirmDeleteTitle: 'Delete this task?',
      confirmDeleteMessage: 'This task and its follow-up comments will be removed permanently.',
      confirmDelete: 'Delete',
      cancelDelete: 'Cancel',
      noMainComment: 'No details provided yet.',
      noTaskComments: 'No follow-up comments yet.'
    },
    preparations: {
      addTitle: 'Create Preparation',
      addDescription: 'Track compounding preparations and update execution status.',
      fields: {
        preparationType: 'Preparation Type',
        composition: 'Composition',
        receivedBy: 'Received by',
        preparedBy: 'Prepared by',
        deliveredBy: 'Delivered by',
        status: 'Status',
        notes: 'Notes'
      },
      placeholders: {
        preparationType: 'Example: Ointment, Syrup',
        composition: 'Ingredients or formula details',
        receivedBy: 'Pharmacist name',
        preparedBy: 'Pharmacist name',
        deliveredBy: 'Pharmacist name',
        notes: 'Optional notes'
      },
      addButton: 'Add Preparation',
      searchLabel: 'Search Preparations',
      searchPlaceholder: 'Search by type, composition, or pharmacist name',
      filterLabel: 'Filter by status',
      listTitle: 'Preparation List',
      empty: 'No preparations found.',
      saveNotes: 'Save notes',
      workflowSave: 'Save workflow',
      delete: 'Delete',
      status: {
        en_cours: 'En cours',
        prepared: 'Prepared',
        delivered: 'Delivered'
      }
    },
    inbody: {
      patientTitle: 'Patients',
      patientDescription: 'Create and manage patients using phone number as Patient ID.',
      patientFields: {
        patientId: 'Patient ID (Phone)',
        fullName: 'Full Name',
        email: 'Email (optional)',
        dateOfBirth: 'Date of Birth'
      },
      patientPlaceholders: {
        patientId: '0550000000',
        fullName: 'Patient full name',
        email: 'patient@email.com'
      },
      addPatient: 'Add Patient',
      patientsListTitle: 'Patient List',
      patientsSearch: 'Search patients by name or ID',
      noPatients: 'No patients yet.',
      testsTitle: 'InBody Tests',
      testsDescription: 'Select a patient to view history and add new test records.',
      testFields: {
        testedAt: 'Test date & time',
        testData: 'Test Data (JSON)',
        notes: 'Notes (optional)'
      },
      testPlaceholders: {
        testData:
          '{\n  "weight": 70.5,\n  "muscleMass": 32.1,\n  "bodyFat": 18.2,\n  "water": 52.3\n}',
        notes: 'Additional notes'
      },
      addTest: 'Add Test',
      noPatientSelected: 'Select a patient to open test history.',
      noTests: 'No tests recorded yet.',
      jsonError: 'Invalid JSON format for test data.'
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
      managementTitle: 'Staff Management',
      managementDescription:
        'Create staff PIN profiles scoped to this pharmacy slug.',
      assignedPinLabel: 'Assigned PIN',
      addStaff: 'Add Staff',
      resetPin: 'Reset PIN',
      delete: 'Delete',
      noStaffProfiles: 'No staff profiles yet.',
      activityTitle: 'Activity Logs',
      noActivity: 'No activity yet.',
      unknownUser: 'Unknown',
      statusDisabled: 'Disabled',
      prompts: {
        resetPin: 'Enter new PIN (2-6 digits). Leave empty to auto-generate.'
      },
      placeholders: {
        staffName: 'Staff name',
        pin: 'PIN (2-6 digits)'
      },
      errors: {
        generic: 'Something went wrong. Please try again.',
        duplicatePin: 'This PIN is already in use. Please choose another PIN.',
        invalidPin: 'Invalid PIN. Use 2 to 6 digits.',
        duplicateName:
          'A staff member with this name already exists in this pharmacy.',
        invalidRole: 'Invalid role. Use Admin or Pharmacist.',
        noPermission:
          'You do not have permission to add staff in this workspace.',
        pinLength: 'PIN must be between 2 and 6 digits'
      },
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
        status: 'Status',
        actions: 'Actions'
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
      setupLabel: 'Owner Setup',
      setupTitle: 'Create your pharmacy dashboard',
      setupText:
        'Set any dashboard name you want, then pick a unique slug for your future link.',
      signedInAs: 'Signed in as',
      dashboardNameLabel: 'Dashboard name',
      dashboardNamePlaceholder: 'My Pharmacy',
      dashboardNameHint: 'This can be any name. You can change it later.',
      dashboardNameRequired: 'Dashboard name is required.',
      slugLabel: 'Unique slug',
      slugPlaceholder: 'my-pharmacy',
      slugHint: 'This will be your pharmacy link.',
      slugInvalid:
        'Use lowercase letters, numbers, and hyphens only. Start and end with a letter or number.',
      slugChecking: 'Checking slug availability...',
      slugAvailable: 'Slug is available.',
      slugTaken: 'Slug is already used.',
      slugCheckError: 'Could not verify slug right now. Please retry.',
      slugTakenError: 'Please choose an available slug before continuing.',
      creating: 'Creating...',
      createPharmacy: 'Create Dashboard'
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
    appName: 'Phlow it',
    pages: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      tasks: 'Tâches',
      preparations: 'Preparations',
      inbody: 'InBody',
      agenda: 'Agenda',
      activity: "Journal d'activite",
      superadmin: 'Super Admin',
      users: 'Utilisateurs',
      subscription: 'Abonnement',
      pendingInvitations: 'Invitations en attente'
    },
    sidebar: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      tasks: 'Tâches',
      preparations: 'Preparations',
      inbody: 'InBody',
      agenda: 'Agenda',
      activity: 'Activite',
      superadminDashboard: 'Superadmin',
      superadminPharmacies: 'Pharmacies',
      superadminUsers: 'Utilisateurs',
      superadminActivity: 'Journal',
      users: 'Utilisateurs',
      subscription: 'Abonnement',
      pendingInvitations: 'Invitations'
    },
    auth: {
      name: 'Nom',
      email: 'E-mail',
      namePlaceholder: 'Votre nom',
      emailPlaceholder: 'vous@pharmacie.local'
    },
    authPage: {
      signIn: 'Connexion',
      helper: 'Utilisez votre compte Google pour vous connecter en tant que propriétaire.',
      cta: 'Continuer avec Google',
      loading: 'Connexion en cours...',
      failed: 'Échec de la connexion Google. Veuillez réessayer.'
    },
    topbar: {
      workspace: 'Espace',
      roleSuperadmin: 'SUPERADMIN',
      roleOwner: 'PROPRIÉTAIRE',
      roleAdmin: 'ADMIN',
      roleWorker: 'PHARMACIEN',
      confirmSignOutTitle: 'Déconnexion',
      confirmSignOut: 'Voulez-vous vraiment vous déconnecter ?',
      confirmYes: 'Se déconnecter',
      confirmNo: 'Annuler'
    },
    dashboard: {
      sideInfoTitle: 'Informations pharmacie',
      pharmacyName: 'Nom pharmacie',
      pharmacySlug: 'Slug pharmacie',
      ownerEmail: 'Email proprietaire',
      staffCount: 'Nombre de staff',
      noWorkspace: 'Tableau de bord',
      noSlug: 'Aucun slug',
      stats: [
        { id: 'finished', label: 'Commandes terminées', delta: 'Archivées' },
        { id: 'due', label: 'À traiter aujourd’hui', delta: 'À vérifier' },
        { id: 'arrived', label: 'Arrivées', delta: 'En pharmacie' },
        { id: 'ordered', label: 'Commandées', delta: 'En cours' },
        { id: 'waiting', label: 'En attente', delta: 'À traiter' },
        { id: 'completed', label: 'Complétées', delta: 'Arrivées + terminées' },
        { id: 'total', label: 'Total', delta: 'Toutes les commandes' }
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
      accept: 'Accepter l’invitation',
      noWorkspaceTitle: 'Aucun espace pour le moment',
      noWorkspaceText:
        'Vous ne pouvez pas accéder aux tableaux de bord tant qu’un propriétaire ne vous invite pas.',
      funHeader: 'En attendant, mini infos pharmacie',
      funFacts: [
        'La pharmacie est l’un des métiers les plus anciens et réglementés.',
        'Un suivi clair du stock réduit fortement les retards urgents.',
        'De courtes notes de transmission réduisent les appels de suivi.'
      ],
      workspaceReadyTitle: 'Vous êtes déjà connecté à un espace',
      workspaceReadyText:
        'Utilisez le menu latéral pour accéder à votre tableau de bord, vos commandes et votre agenda.',
      goDashboard: 'Ouvrir le tableau de bord'
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
        products: 'Produits',
        comment: 'Commentaire',
        category: 'Categorie',
        arrivalDate: 'Date d’arrivée estimée',
        versement: 'Versement'
      },
      placeholders: {
        patientName: 'Nom complet du patient',
        phone: '0550 00 00 00',
        products: 'Exemple : Amoxicilline 500mg, Vitamine C',
        comment: 'Note initiale de commande',
        versement: '0.00'
      },
      validation: {
        patientNameRequired: 'Le nom du patient est requis.',
        phoneRequired: 'Le telephone est requis.',
        productsRequired: 'Au moins un produit est requis.',
        versementInvalid: 'Le versement doit etre un nombre positif ou zero.'
      },
      addArrivalDate: "Ajouter une date d'arrivee",
      removeArrivalDate: "Retirer la date d'arrivee",
      categoryFilterLabel: 'Filtrer par categorie',
      allCategories: 'Toutes les categories',
      requiredFieldsTitle: 'Champs obligatoires',
      requiredFieldsText: 'Patient, produit/medicament et numero de telephone sont obligatoires.',
      optionalFieldsTitle: 'Champs facultatifs',
      optionalFieldsText:
        "La date d'arrivee, le versement et la note peuvent etre ajoutes si besoin.",
      noArrivalDate: 'A planifier',
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
        called: 'Appelée',
        finished: 'Terminée',
        ordered: 'Commandée',
        pending: 'En attente'
      },
      tableTitle: 'Commandes actives',
      finishedTableTitle: 'Commandes terminées',
      finishedEmpty: 'Aucune commande terminée pour le moment.',
      showFinished: 'Afficher les commandes terminées',
      hideFinished: 'Masquer les commandes terminées',
      columns: {
        id: 'ID commande',
        patient: 'Patient',
        phone: 'Téléphone',
        products: 'Produits',
        category: 'Categorie',
        addedBy: 'Ajoutée par',
        arrivalDate: 'Arrivée estimée',
        versement: 'Versement',
        status: 'Statut',
        comments: 'Commentaires',
        actions: 'Actions'
      },
      statusLabel: 'Définir le statut',
      status: {
        pending: 'En attente',
        ordered: 'Commandée',
        called: 'Appelée',
        arrived: 'Arrivée',
        finished: 'Terminée'
      },
      categories: {
        general: 'General',
        orthopedie: 'Orthopedie',
        caba: 'Caba',
        medicament: 'Medicament',
        parapharmacie: 'Parapharmacie',
        'dermo-cosmetique': 'Dermo-cosmetique'
      },
      commentPlaceholder: 'Ajouter un commentaire',
      addComment: 'Publier',
      actionHistory: 'Activité de la commande',
      noActions: "Aucune activité pour cette commande.",
      createdByLabel: 'Ajoutée par',
      createdAtLabel: 'Créée le',
      deleteOrderLabel: 'Supprimer la commande',
      deleteCommentLabel: 'Supprimer le commentaire',
      confirmDeleteOrderTitle: 'Supprimer cette commande ?',
      confirmDeleteOrderMessage:
        'Cette commande et ses commentaires seront supprimés définitivement.',
      confirmDeleteCommentTitle: 'Supprimer ce commentaire ?',
      confirmDeleteCommentMessage: 'Ce commentaire sera supprimé définitivement.',
      confirmDelete: 'Supprimer',
      cancelDelete: 'Annuler',
      noComments: 'Aucun commentaire.',
      detailsTitle: 'Détails de la commande',
      backToOrders: 'Retour aux commandes',
      saveChanges: 'Enregistrer',
      notFound: 'Commande introuvable.',
      actionLabels: {
        CREATE_ORDER: 'Commande créée',
        UPDATE_ORDER: 'Commande modifiée',
        UPDATE_STATUS: 'Statut modifié',
        ADD_ORDER_COMMENT: 'Commentaire ajouté',
        DELETE_ORDER_COMMENT: 'Commentaire supprimé',
        DELETE_ORDER: 'Commande supprimée'
      }
    },
    tasks: {
      addTitle: 'Créer une tâche',
      addDescription:
        "Centralisez les actions en attente de la pharmacie et facilitez les transmissions d'équipe.",
      fields: {
        type: 'Type de tâche',
        customTypeLabel: 'Nom de la tâche personnalisée',
        comment: 'Commentaire / Détails',
        patientName: 'Nom du patient',
        phone: 'Téléphone',
        createdBy: 'Créée par'
      },
      placeholders: {
        customTypeLabel: 'Exemple : Rappeler le grossiste',
        comment: "Contexte utile pour le prochain membre de l'équipe",
        patientName: 'Nom complet du patient',
        phone: '0550 00 00 00',
        search: 'Rechercher par tâche, détails, patient ou téléphone',
        commentInput: 'Ajouter un commentaire de suivi'
      },
      validation: {
        typeRequired: 'Le type de tâche est requis.',
        customTypeLabelRequired: 'Le nom personnalisé est requis.',
        phoneInvalid: 'Le téléphone doit contenir uniquement des chiffres.'
      },
      recommendedHint: 'Facultatif, mais utile pour une meilleure passation.',
      addButton: 'Ajouter la tâche',
      tabs: {
        all: 'Toutes',
        pending: 'En attente',
        done: 'Terminées'
      },
      filters: {
        searchLabel: 'Recherche',
        typeLabel: 'Filtrer par type',
        statusLabel: 'Filtrer par statut',
        allTypes: 'Tous les types',
        allStatuses: 'Tous les statuts'
      },
      status: {
        pending: 'En attente',
        done: 'Terminée'
      },
      typeLabels: {
        ordonnance: 'Ordonnance à faire passer',
        instance: 'Instance',
        patient_appel: 'Patient à appeler',
        autres: 'Autres'
      },
      meta: {
        createdAt: 'Créée',
        updatedAt: 'Mise à jour',
        completedAt: 'Terminée',
        completedBy: 'Terminée par',
        patient: 'Patient',
        phone: 'Téléphone',
        comments: 'Commentaires'
      },
      actions: {
        edit: 'Modifier',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        addComment: 'Publier',
        comments: 'Commentaires',
        hideComments: 'Masquer'
      },
      empty: {
        pending: 'Aucune tâche en attente.',
        done: 'Aucune tâche terminée.',
        all: 'Aucune tâche pour le moment.',
        filtered: 'Aucune tâche ne correspond aux filtres.',
        helper: "Ajoutez la première tâche pour aider l'équipe à rester alignée."
      },
      confirmDeleteTitle: 'Supprimer cette tâche ?',
      confirmDeleteMessage:
        'Cette tâche et ses commentaires de suivi seront supprimés définitivement.',
      confirmDelete: 'Supprimer',
      cancelDelete: 'Annuler',
      noMainComment: 'Aucun détail pour le moment.',
      noTaskComments: 'Aucun commentaire de suivi.'
    },
    preparations: {
      addTitle: 'Creer une preparation',
      addDescription:
        'Suivez les preparations pharmaceutiques et mettez a jour leur statut.',
      fields: {
        preparationType: 'Type de preparation',
        composition: 'Composition',
        receivedBy: 'Recu par',
        preparedBy: 'Prepare par',
        deliveredBy: 'Livre par',
        status: 'Statut',
        notes: 'Notes'
      },
      placeholders: {
        preparationType: 'Exemple : Pommade, Sirop',
        composition: 'Details des ingredients ou formule',
        receivedBy: 'Nom du pharmacien',
        preparedBy: 'Nom du pharmacien',
        deliveredBy: 'Nom du pharmacien',
        notes: 'Notes optionnelles'
      },
      addButton: 'Ajouter preparation',
      searchLabel: 'Rechercher des preparations',
      searchPlaceholder: 'Rechercher par type, composition ou pharmacien',
      filterLabel: 'Filtrer par statut',
      listTitle: 'Liste des preparations',
      empty: 'Aucune preparation trouvee.',
      saveNotes: 'Enregistrer les notes',
      workflowSave: 'Enregistrer workflow',
      delete: 'Supprimer',
      status: {
        en_cours: 'En cours',
        prepared: 'Preparee',
        delivered: 'Livree'
      }
    },
    inbody: {
      patientTitle: 'Patients',
      patientDescription:
        'Ajoutez et gerez les patients en utilisant le telephone comme identifiant.',
      patientFields: {
        patientId: 'ID patient (Telephone)',
        fullName: 'Nom complet',
        email: 'Email (optionnel)',
        dateOfBirth: 'Date de naissance'
      },
      patientPlaceholders: {
        patientId: '0550000000',
        fullName: 'Nom complet du patient',
        email: 'patient@email.com'
      },
      addPatient: 'Ajouter patient',
      patientsListTitle: 'Liste des patients',
      patientsSearch: 'Rechercher par nom ou identifiant',
      noPatients: 'Aucun patient pour le moment.',
      testsTitle: 'Tests InBody',
      testsDescription:
        'Selectionnez un patient pour voir son historique et ajouter de nouveaux tests.',
      testFields: {
        testedAt: 'Date et heure du test',
        testData: 'Donnees du test (JSON)',
        notes: 'Notes (optionnel)'
      },
      testPlaceholders: {
        testData:
          '{\n  "weight": 70.5,\n  "muscleMass": 32.1,\n  "bodyFat": 18.2,\n  "water": 52.3\n}',
        notes: 'Notes supplementaires'
      },
      addTest: 'Ajouter test',
      noPatientSelected: "Selectionnez un patient pour voir l'historique.",
      noTests: 'Aucun test enregistre.',
      jsonError: 'Format JSON invalide pour les donnees du test.'
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
      managementTitle: 'Gestion des membres',
      managementDescription:
        'Creer des profils PIN staff lies au slug de cette pharmacie.',
      assignedPinLabel: 'PIN attribue',
      addStaff: 'Ajouter un membre',
      resetPin: 'Reinitialiser PIN',
      delete: 'Supprimer',
      noStaffProfiles: 'Aucun profil staff pour le moment.',
      activityTitle: "Journal d'activite",
      noActivity: 'Aucune activite pour le moment.',
      unknownUser: 'Inconnu',
      statusDisabled: 'Desactive',
      prompts: {
        resetPin:
          'Entrez un nouveau PIN (2-6 chiffres). Laissez vide pour generation auto.'
      },
      placeholders: {
        staffName: 'Nom du membre',
        pin: 'PIN (2-6 chiffres)'
      },
      errors: {
        generic: "Une erreur s'est produite. Veuillez reessayer.",
        duplicatePin: 'Ce code PIN est deja utilise. Choisissez un autre PIN.',
        invalidPin: 'PIN invalide. Utilisez 2 a 6 chiffres.',
        duplicateName: 'Un membre avec ce nom existe deja dans cette pharmacie.',
        invalidRole: 'Role invalide. Utilisez Administrateur ou Pharmacien.',
        noPermission:
          "Vous n'avez pas la permission d'ajouter un membre dans cet espace.",
        pinLength: 'Le PIN doit contenir entre 2 et 6 chiffres.'
      },
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
        status: 'Statut',
        actions: 'Actions'
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
      setupLabel: 'Configuration propriétaire',
      setupTitle: 'Créez votre tableau de bord pharmacie',
      setupText:
        'Choisissez le nom du tableau de bord que vous voulez, puis un slug unique pour votre lien.',
      signedInAs: 'Connecté en tant que',
      dashboardNameLabel: 'Nom du tableau de bord',
      dashboardNamePlaceholder: 'Ma Pharmacie',
      dashboardNameHint: 'Le nom est libre. Vous pouvez le changer plus tard.',
      dashboardNameRequired: 'Le nom du tableau de bord est requis.',
      slugLabel: 'Slug unique',
      slugPlaceholder: 'ma-pharmacie',
      slugHint: 'Ce slug formera votre lien pharmacie.',
      slugInvalid:
        'Utilisez seulement lettres minuscules, chiffres et tirets. Commencez et terminez par lettre ou chiffre.',
      slugChecking: 'Vérification de disponibilité du slug...',
      slugAvailable: 'Slug disponible.',
      slugTaken: 'Slug déjà utilisé.',
      slugCheckError: 'Vérification impossible pour le moment. Réessayez.',
      slugTakenError: 'Choisissez un slug disponible avant de continuer.',
      creating: 'Creation...',
      createPharmacy: 'Créer le tableau de bord'
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

