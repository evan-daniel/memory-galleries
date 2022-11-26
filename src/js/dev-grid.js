const dev_grid = () => {
    if(process.env.NODE_ENV !== 'development') {
        return; 
    }

    const grid = document.createElement('div'); 
    grid.classList.add('dev-grid'); 
    document.body.appendChild(grid); 
    console.log(grid.clientWidth)

    for(let i = 0; i < 4096; ++i) {
        
        const cell = document.createElement('div'); 
        cell.classList.add('dev-grid-cell'); 
        // cell.setAttribute('', Math.floor(i / 32) % 2 === 0 ? 'false' : 'true'); 
        cell.setAttribute('data-column', `${i % 32}`); 
        cell.setAttribute('data-row', `${Math.floor(i / 32) % 32}`); 
        grid.appendChild(cell); 
    }
}; 

export default dev_grid; 