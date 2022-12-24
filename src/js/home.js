import global from './global.js';

import '../css/global.css'; 
import '../css/home.css'; 

// IMAGES

import hero_img from '../img/sample_hero.png'; 
import mnemonic_img from '../img/bernard_bosanquet.png'; 
import instruction_place from '../img/instruction-place.png'; 
import instruction_building from '../img/instruction-building.png'; 
import instruction_test from '../img/instruction-test.png'; 
import background_history from '../img/cicero.png'; 
import background_research from '../img/brain_place_cells.png'; 

import instruction_arrow from '@material-design-icons/svg/outlined/arrow_circle_right.svg'; 

window.addEventListener('DOMContentLoaded', () => {

  // IMAGES

  document.querySelector('.hero-img').style.backgroundImage = `URL("${hero_img}")`; 
  document.querySelector('[img = "instruction-mnemonic"]').style.backgroundImage = `URL("${mnemonic_img}")`; 
  document.querySelector('[img = "instruction-place"]').style.backgroundImage = `URL("${instruction_place}")`; 
  document.querySelector('[img = "instruction-building"]').style.backgroundImage = `URL("${instruction_building}")`; 
  document.querySelector('[img = "instruction-test"]').style.backgroundImage = `URL("${instruction_test}")`; 
  document.querySelector('[img = "background-history"]').style.backgroundImage = `URL("${background_history}")`; 
  document.querySelector('[img = "background-research"]').style.backgroundImage = `URL("${background_research}")`; 

  document.querySelectorAll('[img = "instruction-arrow"]').forEach(ia => ia.style.backgroundImage = `URL("${instruction_arrow}")`); 

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
  
  if(!palaces || Object.keys(palaces.keys).length === 0) {
    document.querySelector('.palaces').style.display = 'none'; 
    
    palaces = {
      active: '', 
      keys: [], 
    }; 
  }

  save_palaces(); 
  
  // LIST PALACES

  const new_dom_pal = pal_key => {
    const palace_frag = document.querySelector('template[type = "palace"]').content.cloneNode(true); 
    const palace_dom = palace_frag.querySelector('.palace'); 
    document.querySelector('.palaces-list').prepend(palace_frag); 
    
    palace_dom.querySelector('.palace-name').innerText = pal_key; 

    // COUPLE EVENTS
    
    palace_dom.querySelector('.palace-start').addEventListener('click', () => edit_pal(pal_key)); 
    palace_dom.querySelector('.palace-erase').addEventListener('click', () => {
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
    edit_pal(pal_key); 
  }; 
  document.querySelector('.callout-create-submit').addEventListener('click', () => {
    const new_pal_key = document.querySelector('.callout-create-name').value; 
    console.log('CALLOUT CREATE NAME VALUE', new_pal_key); 
    if(!new_pal_key || new_pal_key === '') {
      return; 
    }
    
    new_pal(new_pal_key); 
    save_palaces(); 
    new_dom_pal(new_pal_key); 

    document.querySelector('.callout-create-name').value = ''; 
  }); 

  // ERASE A PALACE

  const erase_pal = pal_key => {
    console.log('ERASING', pal_key); 
    palaces.keys.splice(palaces.keys.indexOf(pal_key), 1); 
    if(palaces.active === pal_key) {
      palaces.active = ''; 
    }
    save_palaces(); 
    localStorage.removeItem(pal_key); 
  }; 

  // REDIRECT FROM PALACE

  const edit_pal = sel_pal => {
    console.log('SELECTED', sel_pal)
    palaces.active = sel_pal; 
    save_palaces(); 
    window.location = '/map'; 
  }; 

}); 
