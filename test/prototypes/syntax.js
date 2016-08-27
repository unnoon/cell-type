/**
 * Created by Rogier on 26/08/2016.
 */

const dsc = Symbol.for('dsc');

var props = {
    // add everything to the property name
    // + works with everything & closest to es6 classes.
    // - downside property names will be out of sync... code completion.
    // -  will not work with getters/setters/symbols
    'static frozen !enumerable override name/alias1/alias2': 666,
    // use a descriptor with special attr$ prop
    // + works with everything
    // - verbose
    // - not 100% fail safe if you define an object with attr$ property (although unlikely)
    // - getters and setters might mot need the attr$ prop per se
    // - functions might be identified as properties
    name1: {attr$: "static frozen !enumerable override aliases='alias1 alias2'", value: 666},  // using a special attr$ object to identify that we are dealing with an descriptor. not 100% fail safe if people also have objects with the name attr$ (although unlikely!)
    // use a descriptor with symbol identification
    // + works with everything
    // - still not 100% fail safe if other people would define the same global symbol
    // - functions might be identified as properties
    // - information might get lost in case we need to multiple times add a property
    name2: {[dsc]: "static frozen !enumerable override aliases='alias1 alias2'", value: 666},
    // use inline annotations + dsc for properties
    // + neat, only verbose for properties that need extra attributes
    name3: function() { "[@@dsc]: static frozen !enumerable override aliases='alias1 alias2'"},
    name4: {[dsc]: "static frozen !enumerable override aliases='alias1 alias2'", value: 666},
    // but could be used in combination with a dsc as above for properties
    // getters & setters
    // note we can only have aliases for properties by creating a getter/setter wrapper.
    // That would be the more consistent way for methods as well in case one wants to override those.
    get x() {return 'ha!'},
};



syms = Object.getOwnPropertySymbols(props.name2);

console.log(props.name2[dsc]);
console.log(props.name2[Symbol.for('dsc')]);
console.log(syms);