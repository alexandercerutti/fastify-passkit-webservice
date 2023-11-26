# Changelog

### **1.1.0**

**Changes**:

- Added hooks-performed checks on return types for `update` and `list` plugins callbacks;
- Replaced `console.warn` with fastify logs;
- Improved tests and typechecking for plugins;

**Bug fix**:

- Fixed `list` plugin, which was listening for `POST` instead of `GET`;
- Renamed `list` plugin's queryString parameters (and, therefore, the according parameter in `onListRetrieve` 'filters') to `passesUpdatedSince`, as per Apple documentation;

---

### **1.0.2**

**Changes**:

- Renamed `onIncomingLog` to `onIncomingLogs`;
