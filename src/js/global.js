// SETTINGS

let allow_dev_grid = false; 
// allow_dev_grid = true; 

import dev_grid from "./dev-grid.js";

const global = () => {
    const resize_def = () => {
        const w = document.documentElement.clientWidth; 
        const h = window.innerHeight; 
        const unit = (w < h ? w : h) / 100; 
        
        document.documentElement.style.setProperty('--vw', `${w / 100}px`); 
        document.documentElement.style.setProperty('--vh', `${h / 100}px`); 
        document.documentElement.style.setProperty('--vmin', `${unit}px`); 
    
        const cells_per_row = w < h ? 32 : Math.floor(w / unit / 3.125)
        document.querySelectorAll('.dev-grid-cell').forEach((cell, cell_index) => {
            const col = cell_index % cells_per_row % 32; 
            const row = (Math.floor(cell_index / cells_per_row) % 32); 
            
            cell.setAttribute('data-column', `${col}`); 
            cell.setAttribute('data-row', `${row}`); 
    
            // INNER FRAME RIGHT
            
            let frame_vertical = col % 8 === 1 || col % 8 === 5; 
            if(row % 8 < 2 || 5 < row % 8) {
                frame_vertical = false; 
            }
            cell.setAttribute('inner-frame-vertical', frame_vertical); 
    
            // INNER FRAME TOP
    
            let frame_horizontal = row % 8 === 1 || row % 8 === 5; 
            if(col % 8 < 2 || 5 < col % 8) {
                frame_horizontal = false; 
            }
            cell.setAttribute('inner-frame-horizontal', frame_horizontal); 
        }); 
    }; 
    
    const resize = new ResizeObserver(entries => resize_def()); 
    resize.observe(document.body); 
    
    window.addEventListener('resize', resize_def); 

    // DEV GRID
    
    if(allow_dev_grid) {
        dev_grid(); 
    }
}

export default global; 