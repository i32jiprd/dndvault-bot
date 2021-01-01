# DND Vault Discord BOT

This "vault bot" enables a party to enable an approval concept of Dungeons and Dragons characters from dndbeyond.com and the changes they make to them.  This allows a (multiple) DMs to ensure that the character changes that a user makes on dndbeyond are accurate for their campaigns.

Invite the bot using --> https://discord.com/api/oauth2/authorize?client_id=792843392664993833&permissions=92224&scope=bot

Workflow would work something like this.

* Discord users join a server and decide to have a campaign.
* Server owner invites BOT
* Each user creates a character for campaign on dndbeyond.com
* Each user 'registers' character with BOT
* DM 'approves' each character
* Mission occurs
* Users update characters on dndbeyond.com
* Users 'update' character with BOT
* DM 'lists queued' character approvals
* DM 'approves' character changes

all the while anyone on the server can 'view' any user's character ...

## Commands

Not all commands are implemented, this is a list of commands that will **hopefully** be implemented in short order. (if ya wanna help, let me know)

- [ ] register [DNDBEYOND_URL] - register a character in the vault from dndbeyond
- [ ] list - list registered characters within vault
  - [ ] all - list all
  - [ ] approved - list all approved
  - [ ] queued - list all characters queued for approval
- [ ] show [@USER] - show a user's characters from character vault
- [ ] update [DNDBEYOND_URL] - request an update a character from dndbeyond to the vault
- [ ] remove [DNDBEYOND_URL] - remove a character from the vault
- [ ] approve [CHAR_ID] - approve a new/updated character within vault
- [ ] changes [CHAR_ID] - display changes for an unapproved character update
- [ ] arole [NEW_ROLE] - modify approver role (allows user to approve characters)
- [ ] prole [NEW_ROLE] - modify player role (allows user to use bot)
- [ ] config - show BOT config

## Notes

### Mongodb queries

{id: { $regex: /785567026512527390/i }}
