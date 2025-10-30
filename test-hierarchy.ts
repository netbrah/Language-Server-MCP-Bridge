/**
 * Test file for call hierarchy and type hierarchy functionality
 * This file will be used to test the new LSP capabilities
 */

class Animal {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    makeSound(): void {
        console.log('Some generic sound');
    }
    
    move(): void {
        console.log(`${this.name} is moving`);
    }
}

class Dog extends Animal {
    breed: string;
    
    constructor(name: string, breed: string) {
        super(name);
        this.breed = breed;
    }
    
    makeSound(): void {
        this.bark();
    }
    
    bark(): void {
        console.log('Woof! Woof!');
    }
    
    fetch(item: string): void {
        console.log(`${this.name} is fetching ${item}`);
    }
}

class Cat extends Animal {
    indoor: boolean;
    
    constructor(name: string, indoor: boolean) {
        super(name);
        this.indoor = indoor;
    }
    
    makeSound(): void {
        this.meow();
    }
    
    meow(): void {
        console.log('Meow!');
    }
}

// Test functions for call hierarchy
function createDog(name: string, breed: string): Dog {
    return new Dog(name, breed);
}

function createCat(name: string, indoor: boolean): Cat {
    return new Cat(name, indoor);
}

function makeAnimalSound(animal: Animal): void {
    animal.makeSound();
}

function testCallHierarchy(): void {
    const dog = createDog('Rex', 'Golden Retriever');
    const cat = createCat('Whiskers', true);
    
    makeAnimalSound(dog);
    makeAnimalSound(cat);
    
    dog.fetch('ball');
    dog.move();
}

// Entry point
function main(): void {
    testCallHierarchy();
}

main();
