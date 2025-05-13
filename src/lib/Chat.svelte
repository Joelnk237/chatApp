<script lang="ts">
    import "bootstrap/dist/css/bootstrap.min.css";
    import { onMount, onDestroy } from "svelte";
    import { currentUser, pb, } from "./pocketbase";
    import "$lib/styles/chat.css";


    let messages = [];
    let newMessage: string;
    let users = [];
    let selectedUser: any = null;

    let showProfile = true;

    let lastMessages = {}; // { [userId]: lastMessage }
    let unreadCounts = {}; // { [userId]: number }

    let unsubscribe: () => void ;
    
    onMount(async () =>{
        // Alle Benutzer laden lassen
        const userList = await pb.collection('users').getList(1, 50, {
            filter: `id != "${$currentUser.id}"`
        });

        // gesendete / empfangene Nachrichten
        const messageHistory = await pb.collection('messages').getFullList({
            filter: `user_from = "${$currentUser.id}" || user_to = "${$currentUser.id}"`,
        });


        // Benutzer-ID speichern
        const contactedUserIds = new Set();
        for (const msg of messageHistory) {
            if (msg.user_from !== $currentUser.id) {
                contactedUserIds.add(msg.user_from);
            }
            if (msg.user_to !== $currentUser.id) {
                contactedUserIds.add(msg.user_to);
            }
        }

        // Benutzer sortieren
        users = userList.items.sort((a, b) => {
            const aHasMessages = contactedUserIds.has(a.id);
            const bHasMessages = contactedUserIds.has(b.id);
            if (aHasMessages === bHasMessages) return 0;
            return aHasMessages ? -1 : 1;
        });
        //users = userList.items;
        await loadLastMessages();

        // aktualisieren, wenn eine neue Nachricht ankommt
        await pb.collection('messages').subscribe('*', async ({ action, record }) => {
            if (action === 'create') {
                await loadLastMessages(); // recharge les aperçus
                await loadUnreadCounts();
            }
        });

        // aktualisieren, wenn ein neuer Benutzer ankommt
        await pb.collection('users').subscribe('*', async ({ action, record }) => {
            if (action === 'create') {
                const newUser = record;
                users = [newUser, ...users];
                await loadLastMessages();
                //sortUsers();
            }
        });

    });

    onDestroy(() => {
        unsubscribe?.();
    });

    function getAvatarUrl(user) {
        if (user?.avatar) {
            return pb.files.getURL(user, user.avatar);
        }
        return 'https://placehold.co/40x40?text=?'; // fallback image
    }

    // man zählt die ungelesenen Nachrichten
    async function loadUnreadCounts() {
        const result = await pb.collection('messages').getFullList({
            filter: `user_to = "${$currentUser.id}" && is_read = false`
        });

        unreadCounts = {};
        for (const msg of result) {
            const fromId = msg.user_from;
            unreadCounts[fromId] = (unreadCounts[fromId] || 0) + 1;
        }
    }




    async function loadMessages(user) {
        selectedUser = user;
        // Lade alle Nachrichten zwischen mir und dem ausgewählten Benutzer.
        const messageList = await pb.collection('messages').getList(1, 10, {
            filter: `(
                (user_from = "${$currentUser.id}" && user_to = "${user.id}") || 
                (user_from = "${user.id}" && user_to = "${$currentUser.id}")
            )`,
            sort: 'created',
            expand: 'user_from,user_to'
        });
        messages = messageList.items;

        // ungelesene Nachrichten abrufen
        const unreadMessages = messages.filter(msg =>
            msg.user_to === $currentUser.id && msg.is_read === false
        );

        // als gelesen markieren
        for (const msg of unreadMessages) {
            await pb.collection('messages').update(msg.id, { is_read: true });
        }
        unreadCounts[user.id] = 0;

        // Neu abonnieren auf neue Nachrichten (bei jedem Wechsel des ausgewählten Benutzers zu wiederholen)
        unsubscribe?.();
        unsubscribe = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
            if (action === 'create') {
                // Überprüfe, ob die Nachricht in diesem Gespräch ist.
                if (
                    (record.user_from === $currentUser.id && record.user_to === selectedUser.id) ||
                    (record.user_from === selectedUser.id && record.user_to === $currentUser.id)
                ) {
                    const expanded = await pb.collection('messages').getOne(record.id, {
                        expand: 'user_from,user_to'
                    });
                    messages = [...messages, expanded];
                }
            }
        });
    }

    
    // Funktion zum Senden einer Nachricht
    async function sendMessage() {
        if (!newMessage.trim()) return;

        const data = {
            text: newMessage,
            user_from: $currentUser.id,
            user_to: selectedUser.id,
            is_read: false
        };
        console.log("sending message:", data);
        await pb.collection('messages').create(data);
        newMessage = "";
    }

    async function deleteMessage(id: string) {
        const confirmDelete = confirm("Möchten Sie die Nachricht löschen ?");
        if (!confirmDelete) return;

        await pb.collection("messages").delete(id);
        messages = messages.filter(msg => msg.id !== id);
    }

    // Die letzten Nachrichten laden
    async function loadLastMessages() {
        for (const user of users) {
            const result = await pb.collection('messages').getList(1, 1, {
                filter: `(
                    (user_from = "${$currentUser.id}" && user_to = "${user.id}") ||
                    (user_from = "${user.id}" && user_to = "${$currentUser.id}")
                )`,
                sort: '-created', // Zuerst die letzen Nachrichten
                expand: 'user_from,user_to'
            });

            if (result.items.length > 0) {
                lastMessages[user.id] = result.items[0];
            } else {
                lastMessages[user.id] = null;
            }
        }
    }

    function logout(){
        pb.authStore.clear();
        currentUser.set(null);
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }


</script>
<nav class="navbar navbar-expand-lg navbar-dark bg-success p-3">
    <a class="navbar-brand text-white" href="#">Chat-App</a>
  
    <div class="navbar-collapse">
      <div class="d-flex w-100">
        <div class="ms-auto">
          <button class="btn btn-danger logout-btn" on:click={logout}>Logout</button>
        </div>
      </div>
    </div>
</nav>


<section class="gradient-custom">
    <div class="container py-5">
  
      <div class="row">
  
        <div class="col-md-6 col-lg-5 col-xl-5 mb-4 mb-md-0">
  
          <h5 class="font-weight-bold mb-3 text-center text-success">Members</h5>
  
          <div class="card mask-custom">
            <div class="card-body">
  
              <ul class="list-unstyled mb-0">
                {#each users as user (user.id)}
                    <li on:click={() => loadMessages(user)} style="cursor:pointer;" class="p-2 border-bottom">
                        <div class="d-flex justify-content-between link-light">
                            <div class="d-flex flex-row">
                                <img src={getAvatarUrl(user)} alt="avatar"
                              class="rounded-circle d-flex align-self-center me-3 shadow-1-strong" width="60">
                                <div class="pt-1">
                                    <p class="fw-bold mb-0 text-primary">{user.username}</p>

                                    {#if lastMessages[user.id]}
                                        <p class="small text-muted mb-0" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            {lastMessages[user.id].text}
                                        </p>
                                    {:else}
                                        <p class="small fst-italic text-muted mb-0">joined Chat App</p>
                                    {/if}
                                </div>
                            </div>
                            <div class="pt-1">
                                
                                {#if unreadCounts[user.id]}
                                    <p class="small text-white mb-1">Just now</p>
                                    <span class="badge bg-danger ms-2 float-end">{unreadCounts[user.id]}</span>
                                {/if}
                            </div>
                        </div>
                    </li>
                {/each}
                
              </ul>
  
            </div>
          </div>
  
        </div>
  
        <div class="col-md-6 col-lg-7 col-xl-7">
            {#if showProfile}
                <ul class="list-unstyled text-white">
                    {#if selectedUser}
                        <div class="chat-banner bg-success text-white p-3 rounded">
                            <h5 class="font-weight-bold mb-3 text-center text-white">Chat with {selectedUser.username}</h5>
                        </div>
                        {#each messages as msg (msg.id)}
                            <li class="d-flex justify-content-between mb-4">
                                {#if msg.expand?.user_from.id == $currentUser.id}
        
                                    <div class="card mask-custom w-100">
                                        <div class="card-header d-flex justify-content-between p-3"
                                        style="border-bottom: 1px solid rgba(255,255,255,.3);">
                                        <p class="fw-bold mb-0">Me: </p> <!-- {msg.expand?.user_from?.username} -->
                                        <p class="text-primary small mb-0"><i class="far fa-clock" style="color: blue;"></i> {formatDate(msg.created)}</p>
                                        </div>
                                        <div class="card-body">
                                        <p class="mb-0">
                                            {msg.text}
                                        </p>
                                        </div>
                                        <button on:click={() => deleteMessage(msg.id)} class="btn btn-sm btn-danger position-absolute" style="bottom: 10px; right: 10px;">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                    <img src={getAvatarUrl(msg.expand?.user_from)} alt="avatar"
                                        class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="60">
        
                                {:else}
                                    
                                    <img src={getAvatarUrl(msg.expand?.user_from)} alt="avatar" class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60" style="cursor: pointer;" on:click={() => showProfile = false}>
                                    <div class="card mask-custom w-100">
                                        <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);">
                                            <p class="fw-bold mb-0">{msg.expand?.user_from?.username}</p>
                                            <p class="text-primary small mb-0"><i class="far fa-clock" style="color: blue;" ></i> {formatDate(msg.created)}</p>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-0">
                                                {msg.text}
                                            </p>
                                        </div>
                                        
                                    </div>
                                    
                                {/if}
                            </li>
                        {/each}
                        <li class="mb-3">
                            <div data-mdb-input-init class="form-outline form-white">
                                <form on:submit|preventDefault={sendMessage}>
                                    <textarea placeholder="write a message" class="form-control" id="textAreaExample3" rows="4" bind:value={newMessage}></textarea>
                                    <label class="form-label text-success" for="textAreaExample3">Message</label>
                                    <button  type="submit" data-mdb-button-init data-mdb-ripple-init class="btn btn-light btn-lg btn-rounded float-end">Send</button>
                                </form>
                            
                            </div>
                        </li>
                        
                    {/if}
                </ul>
            {:else}
                <div class="card mask-custom p-4">
                    <div class="text-center">
                        <img src={getAvatarUrl(selectedUser)} class="rounded-circle mb-3 shadow-1-strong" width="100" alt="Avatar">
                        <h4 class="text-white">{selectedUser.username}</h4>
                        <p class="text-light">{selectedUser.name}</p> 
                        <p class="text-light small fst-italic"> {#if selectedUser} {#if selectedUser.bio}"{selectedUser.bio}" {/if} {/if}</p> 
                        <button class="btn btn-outline-success mt-3" on:click={() => showProfile = true}>← Back</button>
                    </div>
                </div>
            {/if}
            
          
  
        </div>
  
      </div>
  
    </div>
  </section>
