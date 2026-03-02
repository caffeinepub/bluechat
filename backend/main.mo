import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";


// persistent actor state & data migration

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let principalToUserId = Map.empty<Principal, Text>();

  // Media Storage
  include MixinStorage();

  // User Types
  public type UserProfile = {
    id : Text;
    username : Text;
    displayName : Text;
    avatarUrl : ?Text;
    statusMessage : ?Text;
    lastSeen : Time.Time;
  };

  // Media Types
  public type MediaFile = {
    media : Storage.ExternalBlob;
    fileType : FileType;
  };

  public type FileType = {
    #image;
    #video;
    #document;
  };

  // Message Types
  public type Message = {
    id : Text;
    senderId : Text;
    content : Text;
    timestamp : Time.Time;
    conversationId : Text;
    messageType : MessageType;
    mediaFile : ?MediaFile;
    status : MessageStatus;
    deliveryTime : ?Time.Time;
    readTime : ?Time.Time;
  };

  public type MessageType = {
    #text;
    #image;
    #file;
  };

  public type MessageStatus = {
    #sent;
    #delivered;
    #read;
  };

  // Conversation Types
  public type ConversationType = {
    #oneOnOne;
    #group;
  };

  type Conversation = {
    id : Text;
    conversationType : ConversationType;
    name : Text;
    participants : Set.Set<Text>;
    admins : ?Set.Set<Text>;
    messages : List.List<Message>;
    timestamp : Time.Time;
  };

  public type ConversationView = {
    id : Text;
    conversationType : ConversationType;
    name : Text;
    participants : [Text];
    admins : ?[Text];
    messages : [Message];
    timestamp : Time.Time;
  };

  // Global Data
  let userProfiles = Map.empty<Text, UserProfile>(); // upgraded to persistent Map
  let conversations = Map.empty<Text, Conversation>();
  var nextMessageId = 1;

  // Helper Functions
  type UserId = Text;

  func verifyUser(caller : Principal) : Text {
    switch (principalToUserId.get(caller)) {
      case (null) { Runtime.trap("User not registered. Please create a user account.") };
      case (?userId) { userId };
    };
  };

  func verifyParticipant(userId : Text, conversation : Conversation) {
    if (not conversation.participants.contains(userId)) {
      Runtime.trap("Unauthorized: Only participants can perform this action");
    };
  };

  func toConversationView(conv : Conversation) : ConversationView {
    {
      id = conv.id;
      conversationType = conv.conversationType;
      name = conv.name;
      participants = conv.participants.toArray();
      admins = conv.admins.map(func(adminsSet) { adminsSet.toArray() });
      messages = conv.messages.toArray();
      timestamp = conv.timestamp;
    };
  };

  // User Management
  public type CreateUserResult = {
    #authenticationError : Text;
    #userProfile : UserProfile;
  };

  public shared ({ caller }) func createUser(username : Text, displayName : Text) : async CreateUserResult {
    // Reject anonymous principals
    if (caller.isAnonymous()) {
      return #authenticationError("Anonymous principals cannot create a user account");
    };

    if (username.size() < 3 or displayName.size() < 1) {
      return #authenticationError("Username must be at least 3 characters and display name must not be empty");
    };

    // Check if username is already taken
    switch (userProfiles.get(username)) {
      case (?_) {
        return #authenticationError(
          "Username already exists. Please choose a different username"
        );
      };
      case (null) {};
    };

    // Check if this principal already has an account
    switch (principalToUserId.get(caller)) {
      case (?existingUsername) {
        return #authenticationError(
          "Principal already has an associated account with username " # existingUsername
        );
      };
      case (null) {};
    };

    let profile : UserProfile = {
      id = username;
      username;
      displayName;
      avatarUrl = null;
      statusMessage = null;
      lastSeen = Time.now();
    };

    // Persist user profile
    userProfiles.add(username, profile);

    // Map principal to username
    principalToUserId.add(caller, username);

    #userProfile(profile);
  };

  // Required by instructions: get the caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    let userId = verifyUser(caller);
    userProfiles.get(userId);
  };

  // Required by instructions: save the caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    let userId = verifyUser(caller);
    // Ensure the profile id matches the registered username
    if (profile.id != userId) {
      Runtime.trap("Unauthorized: Cannot save profile for another user");
    };
    userProfiles.add(userId, profile);
  };

  // Required by instructions: get any user's profile (public read)
  public query ({ caller }) func getUserProfile(userId : Text) : async ?UserProfile {
    userProfiles.get(userId);
  };

  // Retrieve all users for search/contact discovery - requires registered user
  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can search for other users");
    };
    userProfiles.values().toArray();
  };

  // Conversations
  public shared ({ caller }) func createGroupChat(participants : [UserId], groupName : Text) : async ConversationView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create group chats");
    };

    let creatorId = verifyUser(caller);
    let conversationId = "group_" # groupName # "_" # Time.now().toText() # "_" # caller.toText();

    // Include the creator in participants
    let allParticipants = participants.concat([creatorId]);
    let participantsSet = Set.fromArray(allParticipants);
    let adminsSet = Set.fromArray([creatorId]);

    let conversation : Conversation = {
      id = conversationId;
      conversationType = #group;
      name = groupName;
      participants = participantsSet;
      admins = ?adminsSet;
      messages = List.empty<Message>();
      timestamp = Time.now();
    };

    conversations.add(conversationId, conversation);
    toConversationView(conversation);
  };

  // Create a one-on-one conversation
  public shared ({ caller }) func createOneOnOneConversation(otherUserId : UserId) : async ConversationView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create conversations");
    };

    let callerId = verifyUser(caller);

    // Deterministic conversation ID for a pair of users
    let (a, b) = if (callerId < otherUserId) { (callerId, otherUserId) } else { (otherUserId, callerId) };
    let conversationId = "dm_" # a # "_" # b;

    switch (conversations.get(conversationId)) {
      case (?existing) { toConversationView(existing) };
      case (null) {
        let participantsSet = Set.fromArray([callerId, otherUserId]);
        let conversation : Conversation = {
          id = conversationId;
          conversationType = #oneOnOne;
          name = "";
          participants = participantsSet;
          admins = null;
          messages = List.empty<Message>();
          timestamp = Time.now();
        };
        conversations.add(conversationId, conversation);
        toConversationView(conversation);
      };
    };
  };

  // Messaging
  public shared ({ caller }) func sendMessage(conversationId : Text, content : Text, messageType : MessageType, mediaFile : ?MediaFile) : async Message {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let senderId = verifyUser(caller);
    let timestamp = Time.now();
    let messageId = "msg_" # nextMessageId.toText();

    let message : Message = {
      id = messageId;
      senderId;
      content;
      timestamp;
      conversationId;
      messageType;
      mediaFile;
      status = #sent;
      deliveryTime = null;
      readTime = null;
    };

    nextMessageId += 1;

    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) {
        verifyParticipant(senderId, conv);
        conv;
      };
    };

    let updatedMessages = conversation.messages.clone();
    updatedMessages.add(message);

    // Update lastSeen for the sender
    switch (userProfiles.get(senderId)) {
      case (null) {};
      case (?profile) {
        let updatedProfile : UserProfile = {
          id = profile.id;
          username = profile.username;
          displayName = profile.displayName;
          avatarUrl = profile.avatarUrl;
          statusMessage = profile.statusMessage;
          lastSeen = Time.now();
        };
        userProfiles.add(senderId, updatedProfile);
      };
    };

    let updatedConversation : Conversation = {
      id = conversationId;
      conversationType = conversation.conversationType;
      name = conversation.name;
      participants = conversation.participants;
      admins = conversation.admins;
      messages = updatedMessages;
      timestamp = conversation.timestamp;
    };

    conversations.add(conversationId, updatedConversation);
    message;
  };

  // Message Status Updates
  public shared ({ caller }) func markMessageAsDelivered(conversationId : Text, messageId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update message status");
    };

    let userId = verifyUser(caller);

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        verifyParticipant(userId, conversation);

        let updatedMessages = conversation.messages.map<Message, Message>(
          func(msg) {
            if (msg.id == messageId) {
              {
                id = msg.id;
                senderId = msg.senderId;
                content = msg.content;
                timestamp = msg.timestamp;
                conversationId = msg.conversationId;
                messageType = msg.messageType;
                mediaFile = msg.mediaFile;
                status = #delivered;
                deliveryTime = ?Time.now();
                readTime = null;
              };
            } else { msg };
          }
        );

        let updatedConversation : Conversation = {
          id = conversation.id;
          conversationType = conversation.conversationType;
          name = conversation.name;
          participants = conversation.participants;
          admins = conversation.admins;
          messages = updatedMessages;
          timestamp = conversation.timestamp;
        };

        conversations.add(conversationId, updatedConversation);
      };
    };
  };

  public shared ({ caller }) func markMessageAsRead(conversationId : Text, messageId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update message status");
    };

    let userId = verifyUser(caller);

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        verifyParticipant(userId, conversation);

        let updatedMessages = conversation.messages.map<Message, Message>(
          func(msg) {
            if (msg.id == messageId) {
              {
                id = msg.id;
                senderId = msg.senderId;
                content = msg.content;
                timestamp = msg.timestamp;
                conversationId = msg.conversationId;
                messageType = msg.messageType;
                mediaFile = msg.mediaFile;
                status = #read;
                deliveryTime = msg.deliveryTime;
                readTime = ?Time.now();
              };
            } else { msg };
          }
        );

        let updatedConversation : Conversation = {
          id = conversation.id;
          conversationType = conversation.conversationType;
          name = conversation.name;
          participants = conversation.participants;
          admins = conversation.admins;
          messages = updatedMessages;
          timestamp = conversation.timestamp;
        };

        conversations.add(conversationId, updatedConversation);
      };
    };
  };

  // Update lastSeen (called when user opens the app)
  public shared ({ caller }) func updateLastSeen() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update last seen");
    };

    let userId = verifyUser(caller);
    switch (userProfiles.get(userId)) {
      case (null) {};
      case (?profile) {
        let updatedProfile : UserProfile = {
          id = profile.id;
          username = profile.username;
          displayName = profile.displayName;
          avatarUrl = profile.avatarUrl;
          statusMessage = profile.statusMessage;
          lastSeen = Time.now();
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  // Retrieve a shared version of Conversation
  public shared ({ caller }) func getConversation(conversationId : Text) : async ?ConversationView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let userId = verifyUser(caller);
    switch (conversations.get(conversationId)) {
      case (null) { null };
      case (?conv) {
        // Only participants can view the conversation
        if (not conv.participants.contains(userId)) {
          Runtime.trap("Unauthorized: Only participants can view this conversation");
        };
        ?toConversationView(conv);
      };
    };
  };

  public shared ({ caller }) func getMessages(conversationId : Text, startIdx : Nat, count : Nat) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can read messages");
    };

    let userId = verifyUser(caller);

    switch (conversations.get(conversationId)) {
      case (null) {
        Runtime.trap("Conversation not found");
      };
      case (?conv) {
        // Only participants can read messages
        verifyParticipant(userId, conv);

        let messagesArray = conv.messages.toArray();
        let endIdx = if (startIdx + count >= messagesArray.size()) {
          messagesArray.size();
        } else {
          startIdx + count;
        };
        if (startIdx >= messagesArray.size()) {
          [];
        } else {
          let actualStart = if (startIdx < messagesArray.size()) { startIdx } else { messagesArray.size() };
          let actualEnd = if (endIdx <= messagesArray.size()) { endIdx } else { messagesArray.size() };
          messagesArray.sliceToArray(actualStart, actualEnd);
        };
      };
    };
  };

  // Get all conversations for the current user
  public shared ({ caller }) func getMyConversations() : async [ConversationView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their conversations");
    };

    let userId = verifyUser(caller);
    let result = List.empty<ConversationView>();
    for ((_, conv) in conversations.entries()) {
      if (conv.participants.contains(userId)) {
        result.add(toConversationView(conv));
      };
    };
    result.toArray();
  };

  // Group Invite Helper - public read, no auth required
  public query ({ caller }) func getContactById(userId : Text) : async ?UserProfile {
    userProfiles.get(userId);
  };

  // Media Storage Functions
  public shared ({ caller }) func uploadMedia(blob : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload media");
    };
    blob;
  };

  // Admin: assign roles
  public shared ({ caller }) func adminAssignRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };
};
