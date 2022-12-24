class Palace {

    constructor(filename) {
        
        // DIFFERENTIATES PALACES IN LOCALSTORAGE

        this.filename = filename || 'tmp'; 

        // SETUP

        this.rooms_per_side = 16; 
        
        // MEMORIES
        
        this.loci = []; 
        this.loci_cursor = 0; 

        // ROOMS 
        
        this.rooms = []; 
        for(let y = 0; y < this.rooms_per_side; ++y) {
            this.rooms[y] = []; 
            for(let x = 0; x < this.rooms_per_side; ++x) {
                this.rooms[y][x] = {
                    
                    // CONVENIENCE
                    
                    x: x, 
                    y: y, 

                    // WHETHER YOU CAN WALK IN THE ROOM

                    active: false, 
                    
                    // THE MEMORIES
                    
                    locus: -1, 
                }
            }
        }

        // FIRST ROOM SHOULD ALWAYS BE ACTIVE

        this.rooms[0][0].active = true; 
    }

    async wrangle(palace) {
        if(!palace.rooms || palace.loci === undefined) {
            console.error('TRIED TO LOAD PALACE THAT WAS MISSING FUNDAMENTAL DATA'); 
            return; 
        }

        console.log('WRANGLING…', palace); 

        this.loci_cursor = palace.loci_cursor; 

        // ITERATE THROUGH THROUGH LOCI AND DISCARD THOSE WITH BAD FILE REFERENCES
        
        for(let i = 0; i < palace.loci.length; ++i) {
            const locus_from_storage = palace.loci[i]; 
            if(locus_from_storage.id !== undefined && locus_from_storage.extension && locus_from_storage.filename) {
                const locus_buffer = {
                    id: locus_from_storage.id, 
                    extension: locus_from_storage.extension, 
                    filename: locus_from_storage.filename, 
                    memory: locus_from_storage.memory, 
                }; 
                locus_buffer.handle = await this.storage.mnemonics.getFileHandle(`${locus_buffer.filename}`); 

                if(locus_buffer.handle) {
                    this.loci.push(locus_buffer); 
                }
            }
        }; 

        // ITERATE THROUGH ROOMS AND DISCARD BAD LOCI REFERENCES
        
        for(let y = 0; y < this.rooms_per_side; ++y) {
            for(let x = 0; x < this.rooms_per_side; ++x) {
                this.rooms[y][x] = palace.rooms[y][x]; 

                if(this.rooms[y][x].locus !== -1) {
                    if(this.locus_idx(this.rooms[y][x].locus) === -1) {
                        this.rooms[y][x].locus = -1; 
                    }
                }
            }
        }
    }

    async push_locus(file) {
        let value = -1; 

        const id = this.loci_cursor; 
        const extension = 'png'; 
        const name = `${id}.${extension}`; 
        
        const file_buf = await this.storage.mnemonics.getFileHandle(name, { 'create': true }); 
        const file_writable = await file_buf.createWritable(); 
        try {

            await file_writable.write(file);

            // SUCCEEDED IN WRITING THE FILE

            value = id; 

            // COMMENT OUT TO PREVENT SAVING LOTS OF IMAGES DURING TESTING

            ++this.loci_cursor; 

            const locus = {
                id: id, 
                extension: extension, 
                filename: name, 
                handle: file_buf, 
                memory: '',
            }
            
            this.loci.push(locus); 
            
        } finally {
            await file_writable.close();
        }

        return value; 
        
    }

    // CONVENIENCE
    
    set_locus_memory(id, memory) {
        this.loci.find(locus => locus.id === id).memory = memory; 
    }

    erase_locus(id) {
        if(typeof id !== 'number' || id < 0) {
            console.error('TRIED TO ERASE THAT DOES NOT EXIST'); 
            return; 
        }
        
        this.loci.splice(this.locus_idx(id), 1); 
    }
    
    locus_ref(id) {
        return this.loci.find(locus => locus.id === id); 
    }

    locus_idx(id) {
        return this.loci.findIndex(locus => locus.id === id); 
    }

    remove_locus_from_all_rooms(id) {
        id = +id; 
        this.rooms.filter(room => room.locus === id).forEach(room => {
            room.locus = -1; 
        }); 
    }

    // INIT IS NECESSARY FOR OPFS
    // RESPONSIBILITY OF CALLER TO CALL INIT BEFORE WRANGLING

    async init() {
        this.storage = {}; 
        this.storage.root = await navigator.storage.getDirectory(); 
        this.storage.mnemonics = await this.storage.root.getDirectoryHandle(this.filename, { 'create': true }); 
    }

    // SAVES TO LOCAL STORAGE

    persist() {
        const palace = {
            rooms: this.rooms, 
            rooms_per_side: this.rooms_per_side, 
            loci: [], 
        }; 

        this.loci.forEach(locus => {
            if(locus.id !== undefined && locus.filename !== undefined) {
                palace.loci.push({
                    id: locus.id, 
                    extension: locus.extension, 
                    filename: locus.filename, 
                    memory: locus.memory, 
                }); 
            }
        }); 

        palace.loci_cursor = this.loci_cursor; 
        
        console.log('SAVE', palace, this); 
        
        localStorage.setItem(this.filename, JSON.stringify(palace)); 
    }

}

export default Palace; 