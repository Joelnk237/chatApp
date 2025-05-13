<script lang="ts">
    import Login from "$lib/Login.svelte";
    import Chat from "$lib/Chat.svelte";
    import Signup from "$lib/Signup.svelte";
    import { currentUser, pb, } from "$lib/pocketbase";

    let showSignup = false;
</script>


{#if $currentUser}
    <Chat />
{:else}
    {#if showSignup}
        <Signup on:switchToLogin={() => showSignup = false} />
    {:else}
        <Login on:switchToSignup={() => showSignup = true} />
    {/if}
{/if}

