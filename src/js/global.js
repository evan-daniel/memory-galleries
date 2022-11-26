const global = () => {
    const resize = new ResizeObserver(entries => {
        const w = document.documentElement.clientWidth; 
        const h = window.innerHeight; 
        const unit = (w < h ? w : h) / 100; 
        
        document.documentElement.style.setProperty('--vw', `${w / 100}px`); 
        document.documentElement.style.setProperty('--vh', `${h / 100}px`); 
        document.documentElement.style.setProperty('--vmin', `${unit}px`); 

        const cells_per_row = w < h ? 32 : Math.floor(w / unit / 3.125)
        document.querySelectorAll('.dev-grid-cell').forEach((cell, cell_index) => {
            cell.setAttribute('data-column', `${cell_index % cells_per_row % 32}`); 
            cell.setAttribute('data-row', `${(Math.floor(cell_index / cells_per_row) % 32)}`); 
        }); 
    }); 
    
    resize.observe(document.body); 
}

export default global; 