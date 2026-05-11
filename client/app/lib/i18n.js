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
      chronicPatients: 'Chronic patients',
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
      chronicPatients: 'Chronic patients',
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
        { id: 'pendingOrders', label: 'Pending Orders', delta: 'Not processed yet' },
        { id: 'calledOrders', label: 'Called Orders', delta: 'Patient notified' },
        { id: 'arrivedOrders', label: 'Arrived Orders', delta: 'At pharmacy' },
        { id: 'pendingTasks', label: 'Pending Tasks', delta: 'Team follow-up' }
      ],
      advanced: {
        show: 'Show advanced params',
        hide: 'Hide advanced params',
        totalOrders: 'Total Orders',
        filteredOrders: 'Filtered Orders',
        allTime: 'All time',
        statusBreakdown: 'Current filter',
        statusFilter: 'Order status',
        periodFilter: 'Period',
        allStatuses: 'All statuses',
        periodLabels: {
          day: 'Today',
          month: 'This month',
          year: 'This year'
        }
      },
      workTable: {
        title: 'Orders and Tasks',
        searchLabel: 'General search',
        searchPlaceholder: 'Search orders, tasks, patients, phones, products, or comments',
        userFilterLabel: 'Filter by user',
        allUsers: 'All users',
        resultCount: '{count} items',
        empty: 'No orders or tasks match this search.',
        orderType: 'Order',
        taskType: 'Task',
        columns: {
          type: 'Type',
          item: 'Item',
          patient: 'Patient / Detail',
          phone: 'Phone',
          addedBy: 'Added by',
          status: 'Status',
          date: 'Updated'
        }
      }
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
      userFilterLabel: 'Filter by user',
      allUsers: 'All users',
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
        userLabel: 'Filter by user',
        allTypes: 'All types',
        allStatuses: 'All statuses',
        allUsers: 'All users'
      },
      status: {
        pending: 'Pending',
        done: 'Completed'
      },
      typeLabels: {
        ordonnance: 'Ordonnance à faire passer',
        patient_convoque: 'Patient convoqué',
        patient_appel: 'Patient to call',
        autres: 'Autre'
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
    chronicPatientsView: {
      taskTypes: {
        patient_appel: 'Patient to call',
        patient_convoque: 'Patient summoned',
        ordonnance: 'Prescription to process',
        autres: 'Other'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive'
      },
      renewalStatus: {
        a_jour: 'Up to date',
        renouvellement_possible: 'Renewal available',
        renouvellement_possible_contact: 'Renewal available - contact patient',
        a_contacter: 'Contact patient',
        en_retard: 'Overdue'
      },
      history: {
        created: 'Created',
        updated: 'Updated',
        contact: 'Contact',
        renewal: 'Renewal',
        treatment_added: 'Treatment added',
        treatment_updated: 'Treatment updated',
        treatment_deleted: 'Treatment deleted',
        note: 'Note'
      },
      periods: {
        day: 'day',
        week: 'week',
        month: 'month'
      },
      stats: {
        total: 'Total chronic patients',
        contact: 'To contact',
        possible: 'Renewal available',
        late: 'Overdue'
      },
      title: 'Chronic Patients',
      description: 'Track renewals, regular treatments, and handoffs between staff.',
      addPatient: 'Add Patient',
      searchSr: 'Patient search',
      searchPlaceholder: 'Search by name, phone, or insured number',
      listCount: (shown, total) => `${shown} of ${total} patients`,
      filters: {
        status: 'Status',
        insuranceFund: 'Insurance fund',
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        reset: 'Reset',
        archivedPatients: 'Archived patients',
        activePatients: 'Active patients'
      },
      empty: {
        noContactToday: 'No patients to contact today',
        noPatientsTitle: 'No chronic patients added',
        noPatientsDescription: 'Add a patient to track their renewals',
        noFilteredPatients: 'No patients match the filters.',
        clearFilters: 'Clear filters',
        noTreatments: 'No regular treatments added.'
      },
      table: {
        patient: 'Patient',
        insuranceFund: 'Insurance fund',
        renewalStatus: 'Renewal status',
        treatments: 'Treatments',
        status: 'Status',
        actions: 'Actions',
        insuredNo: 'Insured No.'
      },
      actions: {
        details: 'Details',
        createTask: 'Create task',
        editPatient: 'Edit patient',
        markContacted: 'Mark contacted',
        archive: 'Archive',
        deletePatient: 'Delete patient',
        addTreatment: 'Add treatment',
        edit: 'Edit',
        delete: 'Delete',
        delivered: 'Delivered',
        save: 'Save',
        cancel: 'Cancel'
      },
      panel: {
        record: 'Follow-up record',
        renewal: 'Renewal',
        status: 'Status',
        birthAge: 'Birth / age',
        years: 'years',
        address: 'Address',
        quickContactNote: 'Quick contact note',
        quickContactPlaceholder: 'Example: called, patient will come tomorrow',
        regularTreatments: 'Regular treatments',
        noDetails: 'No details provided',
        posology: 'Posology',
        dosage: 'Dosage',
        doseQuantity: 'Dose',
        schedule: 'Schedule',
        usualQuantity: 'Usual quantity',
        notSet: 'Not set',
        lastDelivery: 'Last delivery',
        next: 'Next',
        daysRemaining: days => `${days} days remaining`,
        dueToday: 'Due today',
        overdueBy: days => `${days} days overdue`,
        noRenewalDate: 'No renewal date',
        optionalDeliveryNote: 'Optional delivery note',
        notesTitle: 'Notes',
        addNote: 'Add note',
        noteListTitle: 'Saved notes',
        noNotes: 'No notes yet.',
        notesPlaceholder: 'Write a new note for this patient'
      },
      patientForm: {
        editTitle: 'Edit patient',
        addTitle: 'Add chronic patient',
        description: 'The insurance fund defaults to CNAS when left empty.',
        fullName: 'Full name',
        phone: 'Phone',
        insuranceFund: 'Insurance fund',
        insuredNumber: 'Insured number',
        birthYear: 'Birth year',
        addFullDate: 'Add full date',
        dateOfBirth: 'Date of birth',
        address: 'Address',
        notes: 'Notes'
      },
      bulkImport: {
        openButton: 'Import patients',
        title: 'Import chronic patients',
        description:
          'Paste a list or upload an Excel, JSON, CSV, TSV, or text file. Supported fields: name, phone, insurance fund, insured number, birth year, address, notes.',
        fileLabel: 'Import file',
        fileHint: 'Excel (.xlsx, .xls), JSON, CSV, TSV, or TXT',
        pasteLabel: 'Paste patient list',
        pastePlaceholder:
          'One patient per line: Full name, phone, CNAS, insured number, birth year, address, notes',
        acceptedHeaders:
          'Accepted headers: name, phone, caisse, numero_assurance, insured_number, birth_year, address, notes.',
        parseButton: 'Preview list',
        importButton: 'Import patients',
        previewTitle: 'Preview',
        previewCount: count => `${count} patients ready`,
        noPreview: 'No valid patients to preview yet.',
        columns: {
          name: 'Name',
          phone: 'Phone',
          insuranceFund: 'Fund',
          insuredNumber: 'Insured No.',
          birthYear: 'Birth year'
        },
        errorsTitle: 'Rows skipped',
        rowError: (row, reason) => `Row ${row}: ${reason}`,
        fileReadError: 'Could not read this file.',
        unsupportedFile: 'Unsupported file type.',
        noRows: 'No patients found. Add at least a name and phone.',
        missingName: 'missing name',
        missingPhone: 'missing phone',
        imported: (created, total) => `${created}/${total} patients imported.`,
        failedImport: 'Some patients could not be imported.'
      },
      taskModal: {
        title: 'Add related task',
        description: 'Choose the type of task to create for this patient.',
        type: 'Task type',
        customName: 'Custom name',
        comment: 'Comment'
      },
      treatmentForm: {
        editTitle: 'Edit treatment',
        addTitle: 'Add treatment',
        product: 'Product / medication',
        dosage: 'Dosage',
        quantityPerDose: 'Quantity per dose',
        quantityPerDosePlaceholder: 'Example: 1 tablet',
        times: 'Times',
        per: 'Per',
        usualQuantity: 'Usual delivered quantity',
        renewal: 'Renewal',
        custom: 'Custom',
        numberOfDays: 'Number of days',
        lastDoseDelivery: 'Last dose / delivery',
        estimatedNext: 'Estimated next',
        notes: 'Notes'
      },
      validation: {
        fullNameRequired: 'Full name is required.',
        phoneRequired: 'Phone number is required.',
        birthYearInvalid: 'Birth year must be between 1900 and 2200.',
        productRequired: 'Product is required.',
        lastDeliveryRequired: 'Last dose/delivery is required.',
        customDaysRequired: 'Enter the number of days.',
        customNameRequired: 'Custom name is required.'
      },
      confirm: {
        deleteTreatmentTitle: 'Delete this treatment?',
        deleteTreatmentMessage: 'This will remove the treatment from chronic patient tracking.',
        delete: 'Delete',
        archivePatientTitle: 'Archive this patient?',
        archivePatientMessage:
          'The patient will become inactive and remain visible with the Inactive filter.',
        archive: 'Archive',
        deletePatientTitle: 'Delete this patient?',
        deletePatientMessage:
          'This will permanently delete the patient, treatments, renewal history, and notes.',
        deletePatientSecondTitle: 'Confirm permanent deletion',
        deletePatientSecondMessage: patientName =>
          `This cannot be undone. Delete ${patientName} permanently?`,
        deletePatientFinal: 'Delete permanently',
        cancel: 'Cancel'
      },
      taskComment: patientName => `Call ${patientName} about chronic treatment renewal`,
      days: days => `${days} days`,
      timesPer: (times, period) => `${times} times / ${period}`,
      posologySchedule: (qty, times, period) => `${qty} x ${times} per ${period}`
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
      noOrders: 'No orders',
      noItems: 'No orders or tasks',
      orderLabel: 'Order',
      taskLabel: 'Task',
      previousMonth: 'Previous month',
      nextMonth: 'Next month'
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
      sessionNotReady: 'Session is still loading. Please retry in a moment.',
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
      chronicPatients: 'Malades chroniques',
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
      chronicPatients: 'Malades chroniques',
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
        { id: 'pendingOrders', label: 'Commandes en attente', delta: 'Pas encore traitees' },
        { id: 'calledOrders', label: 'Commandes avisées', delta: 'Patients avisés' },
        { id: 'arrivedOrders', label: 'Commandes arrivees', delta: 'En pharmacie' },
        { id: 'pendingTasks', label: 'Tâches en attente', delta: 'Suivi equipe' }
      ],
      advanced: {
        show: 'Afficher les paramètres avancés',
        hide: 'Masquer les paramètres avancés',
        totalOrders: 'Total commandes',
        filteredOrders: 'Commandes filtrees',
        allTime: 'Toutes periodes',
        statusBreakdown: 'Filtre actuel',
        statusFilter: 'Statut commande',
        periodFilter: 'Période',
        allStatuses: 'Tous les statuts',
        periodLabels: {
          day: "Aujourd'hui",
          month: 'Ce mois',
          year: 'Cette année'
        }
      },
      workTable: {
        title: 'Commandes et tâches',
        searchLabel: 'Recherche générale',
        searchPlaceholder: 'Rechercher commandes, tâches, patients, téléphones, produits ou commentaires',
        userFilterLabel: 'Filtrer par utilisateur',
        allUsers: 'Tous les utilisateurs',
        resultCount: '{count} elements',
        empty: 'Aucune commande ou tâche ne correspond à cette recherche.',
        orderType: 'Commande',
        taskType: 'Tâche',
        columns: {
          type: 'Type',
          item: 'Element',
          patient: 'Patient / Detail',
          phone: 'Téléphone',
          addedBy: 'Ajoutée par',
          status: 'Statut',
          date: 'Mise à jour'
        }
      }
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
      userFilterLabel: 'Filtrer par utilisateur',
      allUsers: 'Tous les utilisateurs',
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
        called: 'Avisé',
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
        called: 'Avisé',
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
        userLabel: 'Filtrer par utilisateur',
        allTypes: 'Tous les types',
        allStatuses: 'Tous les statuts',
        allUsers: 'Tous les utilisateurs'
      },
      status: {
        pending: 'En attente',
        done: 'Terminée'
      },
      typeLabels: {
        ordonnance: 'Ordonnance à faire passer',
        patient_convoque: 'Patient convoqué',
        patient_appel: 'Patient à appeler',
        autres: 'Autre'
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
    chronicPatientsView: {
      taskTypes: {
        patient_appel: 'Patient à appeler',
        patient_convoque: 'Patient convoqué',
        ordonnance: 'Ordonnance à faire passer',
        autres: 'Autre'
      },
      status: {
        active: 'Actif',
        inactive: 'Inactif'
      },
      renewalStatus: {
        a_jour: 'À jour',
        renouvellement_possible: 'Renouvellement possible',
        renouvellement_possible_contact: 'Renouvellement possible - contacter',
        a_contacter: 'À contacter',
        en_retard: 'En retard'
      },
      history: {
        created: 'Création',
        updated: 'Mise à jour',
        contact: 'Contact',
        renewal: 'Renouvellement',
        treatment_added: 'Traitement ajouté',
        treatment_updated: 'Traitement modifié',
        treatment_deleted: 'Traitement supprimé',
        note: 'Note'
      },
      periods: {
        day: 'jour',
        week: 'semaine',
        month: 'mois'
      },
      stats: {
        total: 'Total malades chroniques',
        contact: 'À contacter',
        possible: 'Renouvellement possible',
        late: 'En retard'
      },
      title: 'Malades chroniques',
      description:
        'Suivi des renouvellements, traitements habituels et transmissions entre employés.',
      addPatient: 'Ajouter patient',
      searchSr: 'Recherche patient',
      searchPlaceholder: "Rechercher par nom, téléphone ou numéro d'assuré",
      listCount: (shown, total) => `${shown} sur ${total} patients`,
      filters: {
        status: 'Statut',
        insuranceFund: 'Caisse',
        all: 'Tous',
        active: 'Actifs',
        inactive: 'Inactifs',
        reset: 'Réinitialiser',
        archivedPatients: 'Patients archivés',
        activePatients: 'Patients actifs'
      },
      empty: {
        noContactToday: "Aucun patient à contacter aujourd'hui",
        noPatientsTitle: 'Aucun malade chronique ajouté',
        noPatientsDescription: 'Ajoutez un patient pour suivre ses renouvellements',
        noFilteredPatients: 'Aucun patient ne correspond aux filtres.',
        clearFilters: 'Effacer les filtres',
        noTreatments: 'Aucun traitement régulier ajouté.'
      },
      table: {
        patient: 'Patient',
        insuranceFund: 'Caisse',
        renewalStatus: 'Statut renouvellement',
        treatments: 'Traitements',
        status: 'Statut',
        actions: 'Actions',
        insuredNo: 'Assuré'
      },
      actions: {
        details: 'Détails',
        createTask: 'Créer tâche',
        editPatient: 'Modifier patient',
        markContacted: 'Marquer contacté',
        archive: 'Archiver',
        deletePatient: 'Supprimer patient',
        addTreatment: 'Ajouter traitement',
        edit: 'Modifier',
        delete: 'Supprimer',
        delivered: 'Livré',
        save: 'Enregistrer',
        cancel: 'Annuler'
      },
      panel: {
        record: 'Dossier de suivi',
        renewal: 'Renouvellement',
        status: 'Statut',
        birthAge: 'Naissance / âge',
        years: 'ans',
        address: 'Adresse',
        quickContactNote: 'Note contact rapide',
        quickContactPlaceholder: 'Exemple : appelé, patient passera demain',
        regularTreatments: 'Traitements réguliers',
        noDetails: 'Détails non renseignés',
        posology: 'Posologie',
        dosage: 'Dosage',
        doseQuantity: 'Dose',
        schedule: 'Rythme',
        usualQuantity: 'Quantité habituelle',
        notSet: 'Non renseigné',
        lastDelivery: 'Dernière livraison',
        next: 'Prochain',
        daysRemaining: days => `${days} jours restants`,
        dueToday: "À renouveler aujourd'hui",
        overdueBy: days => `${days} jours de retard`,
        noRenewalDate: 'Date de renouvellement non renseignée',
        optionalDeliveryNote: 'Note livraison optionnelle',
        notesTitle: 'Notes',
        addNote: 'Ajouter note',
        noteListTitle: 'Notes enregistrées',
        noNotes: 'Aucune note pour le moment.',
        notesPlaceholder: 'Écrire une nouvelle note pour ce patient'
      },
      patientForm: {
        editTitle: 'Modifier patient',
        addTitle: 'Ajouter malade chronique',
        description: "La caisse est CNAS par défaut si elle n'est pas renseignée.",
        fullName: 'Nom complet',
        phone: 'Téléphone',
        insuranceFund: 'Caisse',
        insuredNumber: "Numéro d'assuré",
        birthYear: 'Année de naissance',
        addFullDate: 'Ajouter la date complète',
        dateOfBirth: 'Date de naissance',
        address: 'Adresse',
        notes: 'Notes'
      },
      bulkImport: {
        openButton: 'Importer patients',
        title: 'Importer des malades chroniques',
        description:
          'Collez une liste ou importez un fichier Excel, JSON, CSV, TSV ou texte. Champs supportés : nom, téléphone, caisse, numéro assuré, année de naissance, adresse, notes.',
        fileLabel: 'Fichier à importer',
        fileHint: 'Excel (.xlsx, .xls), JSON, CSV, TSV ou TXT',
        pasteLabel: 'Coller une liste de patients',
        pastePlaceholder:
          'Un patient par ligne : Nom complet, téléphone, CNAS, numéro assuré, année de naissance, adresse, notes',
        acceptedHeaders:
          'En-têtes acceptés : name, phone, caisse, numero_assurance, insured_number, birth_year, address, notes.',
        parseButton: 'Prévisualiser',
        importButton: 'Importer patients',
        previewTitle: 'Prévisualisation',
        previewCount: count => `${count} patients prêts`,
        noPreview: 'Aucun patient valide à prévisualiser pour le moment.',
        columns: {
          name: 'Nom',
          phone: 'Téléphone',
          insuranceFund: 'Caisse',
          insuredNumber: 'Assuré',
          birthYear: 'Année'
        },
        errorsTitle: 'Lignes ignorées',
        rowError: (row, reason) => `Ligne ${row} : ${reason}`,
        fileReadError: 'Impossible de lire ce fichier.',
        unsupportedFile: 'Type de fichier non supporté.',
        noRows: 'Aucun patient trouvé. Ajoutez au moins un nom et un téléphone.',
        missingName: 'nom manquant',
        missingPhone: 'téléphone manquant',
        imported: (created, total) => `${created}/${total} patients importés.`,
        failedImport: "Certains patients n'ont pas pu être importés."
      },
      taskModal: {
        title: 'Ajouter une tâche liée',
        description: 'Choisissez le type de tâche à créer pour ce patient.',
        type: 'Type de tâche',
        customName: 'Nom personnalisé',
        comment: 'Commentaire'
      },
      treatmentForm: {
        editTitle: 'Modifier traitement',
        addTitle: 'Ajouter traitement',
        product: 'Produit / médicament',
        dosage: 'Dosage',
        quantityPerDose: 'Quantité par prise',
        quantityPerDosePlaceholder: 'Exemple : 1 comprimé',
        times: 'Fois',
        per: 'Par',
        usualQuantity: 'Quantité habituellement délivrée',
        renewal: 'Renouvellement',
        custom: 'Personnalisé',
        numberOfDays: 'Nombre de jours',
        lastDoseDelivery: 'Dernière prise / livraison',
        estimatedNext: 'Prochain estimé',
        notes: 'Notes'
      },
      validation: {
        fullNameRequired: 'Le nom complet est obligatoire.',
        phoneRequired: 'Le téléphone est obligatoire.',
        birthYearInvalid: "L'année de naissance doit être entre 1900 et 2200.",
        productRequired: 'Le produit est obligatoire.',
        lastDeliveryRequired: 'La dernière prise/livraison est obligatoire.',
        customDaysRequired: 'Indiquez le nombre de jours.',
        customNameRequired: 'Le nom personnalisé est obligatoire.'
      },
      confirm: {
        deleteTreatmentTitle: 'Supprimer ce traitement ?',
        deleteTreatmentMessage:
          'Cette action retirera ce traitement du suivi chronique.',
        delete: 'Supprimer',
        archivePatientTitle: 'Archiver ce patient ?',
        archivePatientMessage:
          'Le patient passera en inactif et restera visible dans le filtre Inactif.',
        archive: 'Archiver',
        deletePatientTitle: 'Supprimer ce patient ?',
        deletePatientMessage:
          "Cette action supprimera définitivement le patient, ses traitements, son historique et ses notes.",
        deletePatientSecondTitle: 'Confirmer la suppression définitive',
        deletePatientSecondMessage: patientName =>
          `Cette action est irréversible. Supprimer ${patientName} définitivement ?`,
        deletePatientFinal: 'Supprimer définitivement',
        cancel: 'Annuler'
      },
      taskComment: patientName =>
        `Appeler ${patientName} pour renouvellement traitement chronique`,
      days: days => `${days} jours`,
      timesPer: (times, period) => `${times} fois / ${period}`,
      posologySchedule: (qty, times, period) => `${qty} x ${times} par ${period}`
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
      noOrders: 'Aucune commande',
      noItems: 'Aucune commande ou tâche',
      orderLabel: 'Commande',
      taskLabel: 'Tâche',
      previousMonth: 'Mois précédent',
      nextMonth: 'Mois suivant'
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
      sessionNotReady: 'La session est en cours de chargement. Réessayez dans un instant.',
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

