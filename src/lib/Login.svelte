<script lang="ts">

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import { currentUser, pb, } from "./pocketbase";
    import "bootstrap/dist/css/bootstrap.min.css";
    import "$lib/styles/login.css";


    let username: string;
    let password: string;

    let showSignUp = false;

    let errorMessage: string = ''; // Anzeigen Beim Fehler

    async function login() {
        if (!username || !password) {
            errorMessage = "All fields must be filled in.";
            return;
        }
        //await pb.collection('users').authWithPassword(username, password);
        try {
            await pb.collection('users').authWithPassword(username, password);
            currentUser.set(pb.authStore.model); // Ajoute cette ligne pour rafraîchir
        } catch (err) {
            errorMessage = "invalid username or password";
            console.error("invalid username or password", err);
        }
    }


    

</script>


{#if $currentUser}
    <p> Signed as { $currentUser.username }</p>
{:else}





        <nav class="navbar navbar-dark bg-success p-3">
            <div class="container">
                <a class="navbar-brand" href="#">Chat-App</a>
            </div>
        </nav>
        
        <div class="container mt-5 text-center">
            <div class="card p-4 bg-white">
                <h2 class="mb-3">Willkommen bei Chat-App </h2>
                <p class="text-muted">Loggen Sie sich ein oder auf klicken Registrieren Sie sich,falls Sie neu sind !</p>
            </div>
        </div>
        
        <div class="container mt-4">
            <form on:submit|preventDefault>
                <p style="text-align: center;">
                    <label  > Username :</label>
                    <input placeholder="username" type="text" bind:value={username}/>
                </p>
                <p style="text-align: center;">
                    <label > Password  : </label>
                    <input placeholder="password" type="password" bind:value={password}/>
                </p>
            </form>
            {#if errorMessage}
                <p style="color: red; text-align: center;">{errorMessage}</p>
            {/if}
            <div class="row justify-content-center">
                <div class="col-md-3 col-6 mb-3">
                    <button class="btn btn-primary w-100" on:click={() => dispatch('switchToSignup')}>Sign Up</button>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <button class="btn btn-success w-100" on:click={login}>Login</button>
                </div>
            </div>
        </div>        
    
    
{/if}

