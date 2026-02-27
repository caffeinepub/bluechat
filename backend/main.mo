import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

actor {
  type Message = {
    sender : Principal;
    content : Text;
    timestamp : Time.Time;
    conversationId : Text;
  };

  let messages = Map.empty<Text, List.List<Message>>();

  public shared ({ caller }) func postMessage(conversationId : Text, content : Text) : async () {
    let message : Message = {
      sender = caller;
      content;
      timestamp = Time.now();
      conversationId;
    };

    let currentMessages = switch (messages.get(conversationId)) {
      case (null) { List.empty<Message>() };
      case (?msgs) { msgs };
    };

    currentMessages.add(message);
    messages.add(conversationId, currentMessages);
  };

  public query ({ caller }) func getMessages(conversationId : Text) : async [Message] {
    switch (messages.get(conversationId)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };

  public shared ({ caller }) func clearConversation(conversationId : Text) : async () {
    messages.remove(conversationId);
  };
};
