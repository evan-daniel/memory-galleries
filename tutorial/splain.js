window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

    document.querySelector('.splain').innerText = splaining.welcome; 

    const splain_1 = document.createElement('div'); 
    splain_1.className = 'splain'; 
    splain_1.innerText = `And I don't necessarily mean about playing a game well, but about playing well inside of a game.  What I'm trying to say is that playing a game well is an art form.  It's a very difficult thing to achieve, and I'm going to try to get you to that point before you get out there … on the plain.`; 
    document.querySelector('.splain-container').appendChild(splain_1); 
}); 

const splaining = {
    welcome: `It took you that long to move?  This is going to be a long day.\nWell, hi.  I'm here to teach you how to get the most out of this game, because people don't realize it, but games are really a mode of self-expression.  I don't want to get on a tangent here, but when I was growing up my parents absolutely didn't understand how important gaming was or how … I don't want to say 'intellectual', but sure … how intellectual it was.  `,
}; 