import PocketBase from 'pocketbase' ;
import { writable } from 'svelte/store' ; 
export const pb = new PocketBase('http://127.0.0.1:8090') ;
export const currentUser = writable(pb.authStore.model) ;

pb.authStore.onChange((auth) => {
    console.log('User changer', auth);
    currentUser.set(pb.authStore.model);
});