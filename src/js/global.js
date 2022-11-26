const global = () => {
    const resize = new ResizeObserver(entries => {
        document.documentElement.style.setProperty('--rvw', `${document.documentElement.clientWidth / 100}px`); 
        document.documentElement.style.setProperty('--rvh', `${document.documentElement.clientHeight / 100}px`); 
    }); 
    
    resize.observe(document.body); 
}

export default global; 