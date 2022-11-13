import '../css/global.css'; 
import '../css/home.css'; 

window.addEventListener('DOMContentLoaded', () => {

  // GET PALACES
  // OR CREATE
  
  let palaces = JSON.parse(localStorage.getItem('palaces')); 
  const save_palaces = () => {
    console.log('SAVING PALACES', palaces); 
    localStorage.setItem('palaces', JSON.stringify(palaces)); 
  }; 
  if(!palaces || Object.keys(palaces).length === 0) {
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
    document.querySelector('.palaces').prepend(palace_frag); 
    
    palace_dom.querySelector('.palace-key').innerText = pal_key; 

    // CLICKING A PALACE REDIRECTS TO THE EDIT PAGE
    
    palace_dom.addEventListener('click', () => edit_pal(pal_key)); 
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

  // REDIRECT FROM PALACE

  const edit_pal = sel_pal => {
    console.log('SELECTED', sel_pal)
    palaces.active = sel_pal; 
    save_palaces(); 
    window.location = '/map'; 
  }; 

}); 