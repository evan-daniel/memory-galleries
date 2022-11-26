import global from './global.js';
import dev_grid from './dev-grid.js'; 

import '../css/global.css'; 
import '../css/home.css'; 

window.addEventListener('DOMContentLoaded', () => {

  global(); 

  // GET PALACES
  // OR CREATE
  
  let palaces = JSON.parse(localStorage.getItem('palaces')); 
  const save_palaces = () => {
    console.log('SAVING PALACES', palaces); 
    localStorage.setItem('palaces', JSON.stringify(palaces)); 
  }; 

  // IF THERE IS NO PALACES OBJECT STORED IN LOCALSTORAGE
  // OR IF THERE ARE NO PALACES STORED IN THE LOCALSTORAGE OBJECT
  
  if(!palaces || Object.keys(palaces).length === 0) {
    palaces = {
      active: '', 
      keys: [], 
    }; 

    // document.querySelector('.palaces-interface').setAttribute()
  }

  save_palaces(); 
  
  // LIST PALACES

  const new_dom_pal = pal_key => {
    const palace_frag = document.querySelector('template[type = "palace"]').content.cloneNode(true); 
    const palace_dom = palace_frag.querySelector('.palace'); 
    document.querySelector('.palaces').prepend(palace_frag); 
    
    palace_dom.querySelector('.palace-key').innerText = pal_key; 

    // COUPLE EVENTS
    
    palace_dom.querySelector('.palace-key').addEventListener('click', () => edit_pal(pal_key)); 
    palace_dom.querySelector('.erase-palace').addEventListener('click', () => {
      erase_pal(pal_key); 
      palace_dom.remove(); 
    }); 
  }; 
  for(let palace of palaces.keys) {
    new_dom_pal(palace); 
  }

  // MAMKE PALACE

  const new_pal = pal_key => {
    console.log('NEW MALACE', pal_key); 
    palaces.keys.push(pal_key); 
    palaces.active = pal_key; 
  }; 
  document.querySelector('.new-palace-submit').addEventListener('click', () => {
    const new_pal_key = document.querySelector('.new-palace-key').value; 
    if(!new_pal_key || new_pal_key === '') {
      return; 
    }
    
    new_pal(new_pal_key); 
    save_palaces(); 
    new_dom_pal(new_pal_key); 

    document.querySelector('.new-palace-submit').value = ''; 
  }); 

  // ERASE A PALACE

  const erase_pal = pal_key => {
    console.log('ERASING', pal_key); 
    palaces.keys.splice(palaces.keys.indexOf(pal_key), 1); 
    if(palaces.active === pal_key) {
      palaces.active = ''; 
    }
    save_palaces(); 
  }; 

  // REDIRECT FROM PALACE

  const edit_pal = sel_pal => {
    console.log('SELECTED', sel_pal)
    palaces.active = sel_pal; 
    save_palaces(); 
    window.location = '/map'; 
  }; 

  // DEV GRID

  if(
    process.env.NODE_ENV === 'development' 
    && false
  ) {
    dev_grid(); 
  }

}); 