# Krishakarya Zero-Trust Security Specification

## 1. Core Data Invariants & Authorization Boundaries
1. **Users (`/users/{userId}`)**:
   - Only the authenticated user matching `request.auth.uid == userId` can create, update, or delete their profile.
   - Arbitrary listing of all users (`allow list`) is blocked to prevent data harvesting. Single profile `get` is permitted for public marketplace view.
2. **Usernames Registry (`/usernames/{usernameId}`)**:
   - Handles cannot be spoofed or claimed on behalf of other users; `incoming().userId` must equal `request.auth.uid`.
   - Handles can only be updated/deleted by the owning user.
3. **Sahyogis (`/sahyogis/{sahyogiId}`)**:
   - Anyone can view helper listings (`allow read`).
   - Only the authenticated user can create/edit/delete their own helper listing (`userId == request.auth.uid`).
   - Rate validation: `dailyRate > 0`.
4. **Machineries (`/machineries/{machineryId}`)**:
   - Anyone can browse machinery listings (`allow read`).
   - Only the authenticated owner can create/edit/delete their machinery listing (`ownerId == request.auth.uid`).
   - Rate validation: `ratePerDay > 0`.
5. **Bookings (`/bookings/{bookingId}`)**:
   - Strict ABAC privacy: ONLY the renter (`renterId`) or the owner/sahyogi (`ownerId`) can read, list, or update the booking.
   - Unrelated third parties receive `PERMISSION_DENIED`.
   - Immutable fields during update: `id`, `itemId`, `type`, `renterId`, `ownerId`.
   - Valid statuses: `['Pending', 'Confirmed', 'Declined', 'Completed', 'Cancelled']`.
6. **Kisan Khatabook Ledger (`/ledger_entries/{entryId}`)**:
   - Total financial privacy: Read, list, create, update, and delete access is strictly restricted to `userId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Target Attack Vectors)
1. **Unauthenticated Write Attack**: Anonymous or unauthenticated write to `/users/victim_123` -> REJECTED.
2. **User Profile Impersonation**: Attacker (UID `attacker_99`) attempts to overwrite `/users/victim_123` -> REJECTED.
3. **Handle Hijacking Attack**: Attacker attempts to register `/usernames/kisan_hero` with `userId: 'victim_123'` -> REJECTED.
4. **Spoofed Sahyogi Listing**: Attacker creates a Sahyogi listing with `userId: 'victim_123'` -> REJECTED.
5. **Unauthorized Sahyogi Modification**: Attacker attempts to delete or update another user's Sahyogi card -> REJECTED.
6. **Spoofed Machinery Ownership**: Attacker creates a tractor rental listing with `ownerId: 'victim_123'` -> REJECTED.
7. **Unauthorized Machinery Deletion**: Attacker attempts to delete another provider's machinery record -> REJECTED.
8. **Third-Party Booking Snooping**: Attacker attempts to list or read private bookings where they are neither `renterId` nor `ownerId` -> REJECTED.
9. **Booking Price Tampering**: Attacker attempts to update the `totalAmount` or change `ownerId` on an existing booking -> REJECTED.
10. **Financial Ledger Snoop Attack**: Attacker queries another farmer's `/ledger_entries` -> REJECTED.
11. **Ledger Entry Injection**: Attacker injects fake expenses into another user's Khatabook (`userId: 'victim_123'`) -> REJECTED.
12. **Negative/Invalid Value Injection**: Attacker sends negative rate or malformed status -> REJECTED.
