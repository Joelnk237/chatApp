<script lang="ts">
    import { currentUser, pb, } from "./pocketbase";
    import "bootstrap/dist/css/bootstrap.min.css";
    import "$lib/styles/signup.css";

    let name: string;
    let username: string;
    let password: string;
    let passwordConfirm: string;
    let email: string;

    let errorMessage = '';
    let showLogin = false;

    let bio: string = '';
    let avatarFile: File | null = null;
    

    async function signUp() {

        errorMessage = '';
        if (!name || !username || !email || !password || !passwordConfirm) {
            errorMessage = "All fields must be filled in.";
            return;
        }

        if (password.length < 8) {
            errorMessage = "The password must be at least 8 characters long.";
            return;
        }


        if (password !== passwordConfirm) {
            errorMessage = "Die Passwörter müssen übereinstimmen";
            return;
        }
        try{
            
            /*const data = {
                "email": email,
                "emailVisibility": true,
                "name": name,
                "username": username,
                "password": password,
                "passwordConfirm": password
            };*/

            const formData = new FormData();
            formData.append("email", email);
            formData.append("emailVisibility", "true");
            formData.append("name", name);
            formData.append("username", username);
            formData.append("password", password);
            formData.append("passwordConfirm", password);

            if (bio) {
                formData.append("bio", bio);
            }

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const createdUser = await pb.collection('users').create(formData);
            await pb.collection('users').authWithPassword(username, password);
            currentUser.set(pb.authStore.model);
        } catch ( err ){
            console.log(err)

            if (err?.response?.data) {
                if (err.response.data.username) {
                    errorMessage = "This username is already in use, please change it or log in with this username";
                } else if (err.response.data.email) {
                    errorMessage = "This Email is already in use, please change it or log in with this username";
                } else {
                    // si autre erreur venant du backend
                    errorMessage = Object.values(err.response.data)
                        .map((e: any) => e.message)
                        .join(', ') || "Error during Signup";
                }
            } else {
                errorMessage = "Error during Signup";
            }
        }
        
    }

    function signOut(){
        pb.authStore.clear();
    }

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
</script>

{#if $currentUser}
    <p> Signed as { $currentUser.username }</p>
{:else}

   
        <!--<form on:submit|preventDefault={signUp}>
            <input placeholder="Name" type="text" bind:value={name}/>
            <input placeholder="E-Mail" type="text" bind:value={email}/>
            <input placeholder="username" type="text" bind:value={username}/>
            <input placeholder="password" type="password" bind:value={password}/>
            <input placeholder="Confirm password" type="password" bind:value={passwordConfirm}/>

            {#if errorMessage}
                <p style="color: red;">{errorMessage}</p>
            {/if}
        </form>
        <button on:click={signUp}>signUp</button>
        <button on:click={() => dispatch('switchToLogin')}>Login</button> -->





        <nav class="navbar navbar-dark bg-success p-3">
            <div class="container">
                <a class="navbar-brand" href="#">Chat-App</a>
            </div>
        </nav>
        
        <div class="container mt-5 text-center">
            <div class="card p-4 bg-white">
                <h2 class="mb-3">Registrierung bei Chat-App </h2>
                <p style="color:red" ><b>Füllen Sie sorgfältig alle Felder aus </b></p>
            </div>
        </div>
        <div class="container mt-5 text-center">
            <form on:submit|preventDefault={signUp}>
                <p>
                    <label><b> Name: </b></label>
                    <input placeholder="Name" type="text" bind:value={name}/>
                </p>
                
                <div class="mb-3">
                    <label ><b> E-Mail Adresse :</b></label>
                    <input placeholder="E-Mail" type="text" bind:value={email}/>
                </div>
                <div class="mb-3">
                    <label ><b> Username :</b></label>
                    <input placeholder="username" type="text" bind:value={username}/>
                </div>
                <div class="mb-3">
                    <label ><b> Password: </b></label>
                    <input placeholder="password" type="password" bind:value={password}/>
                </div>
                <div class="mb-3">
                    <label ><b>Confirm Password: </b></label>
                    <input placeholder="Confirm password" type="password" bind:value={passwordConfirm}/>
                </div>
                <div class="mb-3">
                    <label><b>Bio (optional):</b></label>
                    <textarea placeholder="Write something about yourself..." rows="3" bind:value={bio}></textarea>
                </div>
                
                <div class="mb-3">
                    <label><b>Avatar (optional):</b></label>
                    <input type="file" accept="image/*" on:change={(e) => avatarFile = e.target.files[0]} />
                </div>

                {#if errorMessage}
                    <p style="color: red; text-align: center;">{errorMessage}</p>
                {/if}
                <button class="btn btn-success w-100" on:click={signUp}>signUp</button>
                <button class="btn btn-primary w-100" on:click={() => dispatch('switchToLogin')}>Login</button>
            </form>
            
        </div>

    
{/if}