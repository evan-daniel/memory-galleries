class Palace {

    constructor() {

        // SETUP

        this.RoomsPerSide = 16; 
        
        // MEMORIES
        
        this.Memories = []; 
        this.MemoryCount = 0; 

        // ROOMS 
        
        this.Rooms = []; 
        for(let y = 0; y < this.RoomsPerSide; ++y) {
            this.Rooms[y] = []; 
            for(let x = 0; x < this.RoomsPerSide; ++x) {
                this.Rooms[y][x] = {
                    
                    // CONVENIENCE
                    
                    x: x, 
                    y: y, 

                    // WHETHER YOU CAN WALK IN THE ROOM

                    active: false, 
                    
                    // THE MEMORIES
                    
                    memory: -1, 
                }
            }
        }
    }

    async load(palace) {
        if(!palace.Rooms || palace.Memories === undefined) {
            console.error('TRIED TO LOAD PALACE THAT WAS MISSING DATA'); 
            return; 
        }

        console.log('LOADING…', palace); 

        for(let i = 0; i < this.RoomsPerSide; ++i) {
            this.Rooms[i] = palace.Rooms[i]; 
        }

        for(let i = 0; i < palace.Memories.length; ++i) {
            const memory = palace.Memories[i]; 
            if(memory.id !== undefined && memory.extension && memory.fileName) {
                const newMemoryObj = {
                    type: memory.type, 
                    id: memory.id, 
                    extension: memory.extension, 
                    fileName: memory.fileName, 
                    assertion: memory.assertion, 
                }; 
                if(memory.type === 'file') {
                    newMemoryObj.handle = await this.Storage.MemoryImages.getFileHandle(`${newMemoryObj.fileName}`); 
                }
                this.Memories.push(newMemoryObj); 
            }
        }; 
        this.MemoryCount = palace.Memories.length; 

    }

    async addMemory(file) {
        let value = -1; 

        const id = this.MemoryCount; 
        const extension = 'png'; 
        const name = `${id}.${extension}`; 
        
        const tmpFile = await this.Storage.MemoryImages.getFileHandle(name, { 'create': true }); 
        const tmpWtr = await tmpFile.createWritable(); 
        try {

            await tmpWtr.write(file);

            // SUCCEEDED IN WRITING THE FILE

            value = id; 

            // COMMENT OUT TO PREVENT SAVING LOTS OF IMAGES DURING TESTING

            ++this.MemoryCount; 

            const mem = {
                type: 'file', 
                id: id, 
                extension: extension, 
                fileName: name, 
                handle: tmpFile, 
                assertion: '',
            }
            
            
            this.Memories.push(mem); 
            

        } finally {
            await tmpWtr.close();
        }

        return value; 
        
    }

    set_mem_assertion(id, assertion) {
        this.Memories.find(mem => mem.id === id).assertion = assertion; 
    }

    erase_mem(id) {
        if(typeof id !== 'number' || id < 0) {
            console.error('TRIED TO ERASE THAT DOES NOT EXIST'); 
            return; 
        }
        
        this.Memories.splice(this.mem_idx(id), 1); 
    }

    // CONVENIENCE
    
    mem_ref(id) {
        return this.Memories.find(mem => mem.id === id); 
    }

    mem_idx(id) {
        return this.Memories.findIndex(mem => mem.id === id); 
    }

    getRoomsPerSide() {
        return this.RoomsPerSide; 
    }

    // BUILD INITIATES OPFS

    async Build() {
        this.Storage = {}; 
        this.Storage.Root = await navigator.storage.getDirectory(); 
        this.Storage.MemoryImages = await this.Storage.Root.getDirectoryHandle('tmp', { 'create': true }); 
    }

    // SAVES TO LOCAL STORAGE

    Save() {
        const pal = {
            Rooms: this.Rooms, 
            RoomsPerSide: this.RoomsPerSide, 
            Memories: [], 
        }; 

        this.Memories.forEach(mem => {
            if(mem.id !== undefined && mem.fileName !== undefined) {
                pal.Memories.push({
                    type: mem.type, 
                    id: mem.id, 
                    extension: mem.extension, 
                    fileName: mem.fileName, 
                    assertion: mem.assertion, 
                })
            }
        }); 

        pal.MemoryCount = pal.Memories.length; 
        
        console.log('SAVE', pal, this); 
        
        localStorage.setItem('palace', JSON.stringify(pal)); 
    }

}

export default Palace; 