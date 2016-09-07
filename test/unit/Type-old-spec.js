define([
    'bottom_line',
    'cell/core/Type'
], function(_, Type) {
    beforeEach(function() {
        sinon.stub(console, 'log');
        sinon.stub(console, 'warn');
        sinon.stub(console, 'error');
    });

    afterEach(function() {
        sinon.restore(console, 'log');
        sinon.restore(console, 'warn');
        sinon.restore(console, 'error');
    });

    xdescribe("t1: simple inheritance", function() {

        it("test basic inheritance principles", function() {
            var BH = new Type('basicHuman-t1')
                .properties({
                    ctor: function(name)
                    {
                        this.name = name;
                    },
                    m: function()
                    {
                        return 'bhm'
                    },
                    bhum: function()
                    {
                        return 'bhum'
                    },
                    om: function() {
                        // just to be able to test overrides
                    }
                });

            var H = new Type('human-t1').inherits(BH)
                .properties({
                    'ctor': function(name)
                    {
                        this._upper(name);
                    },
                    'static s': 's',
                    'm': function()
                    {
                        return this._upper()+' hm'
                    },
                    'hum': function()
                    {
                        return 'hum'
                    },
                    'om': function() {
                        // check if console outputs a warning: overriding om in class human but not using super
                    }
                });

            var h = H.spawn('unnoon');

            expect(h.name).to.deep.equal('unnoon');
            expect(h.m()).to.deep.equal('bhm hm');
            expect(h.bhum()).to.deep.equal('bhum');
            expect(h.hum()).to.deep.equal('hum');
            expect(h.s).to.deep.equal('s');
            expect(BH.isPrototypeOf(h)).to.be.true;
            expect(H.isPrototypeOf(h)).to.be.true;
            expect(console.warn.calledWith('[constructing Type: human-t1] not calling upper in overriding property(value): om.')).to.be.true;
        });
    });

    describe("t2: simple old style inheritance", function() {

        it("test basic inheritance principles", function() {

            function BH(name)
            {
                this.name = name;
            }

            BH.prototype.m = function()
            {
                return 'bhm'
            };


            BH.prototype.bhum = function()
            {
                return 'bhum'
            };

            BH.prototype.om = function()
            {
                // just to be able to test overrides
            };

            var H = new Type('human-t2').inherits(BH)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    'static s': 's',
                    m: function()
                    {
                        return this._upper()+' hm'
                    },
                    hum: function()
                    {
                        return 'hum'
                    },
                    om: function() {
                        // check if console outputs a warning: overriding om in class human but not using super
                    }
                });

            var h = H.spawn('unnoon');

            expect(h.name).to.deep.equal('unnoon');
            expect(h.m()).to.deep.equal('bhm hm');
            expect(h.bhum()).to.deep.equal('bhum');
            expect(h.hum()).to.deep.equal('hum');
            expect(h.s).to.deep.equal('s');
            expect(BH.prototype.isPrototypeOf(h)).to.be.true;
            expect(H.isPrototypeOf(h)).to.be.true;
            expect(console.warn.calledWith('[constructing Type: human-t2] not calling upper in overriding property(value): om.')).to.be.true;
        });
    });

    describe("t3: regex testing", function() {
        it("illegal private usage", function() {

            expect(Type.settings.rgx_illegalPrivateUse.test('notthis._prop')).to.be.true;
            expect(Type.settings.rgx_illegalPrivateUse.test('this._prop')).to.be.false;
            expect(Type.settings.rgx_illegalPrivateUse.test('notthis.__prop')).to.be.false;
            expect(Type.settings.rgx_illegalPrivateUse.test('notthis._.prop')).to.be.false;
            expect(Type.settings.rgx_illegalPrivateUse.test('notthis._')).to.be.false;
            expect(Type.settings.rgx_illegalPrivateUse.test('notthis.prop')).to.be.false;
            expect(Type.settings.rgx_illegalPrivateUse.test('this.prop')).to.be.false;
        });

        it("super usage", function() {
            expect(Type.settings.rgx_upper.test('this._upper')).to.be.true;
            expect(Type.settings.rgx_upper.test('notthis._upper')).to.be.false;
            expect(Type.settings.rgx_upper.test('notthis._upperThingie')).to.be.false;
            expect(Type.settings.rgx_upper.test('this._upperThingie')).to.be.false;
            expect(Type.settings.rgx_upper.test('notthis.prop')).to.be.false;
            expect(Type.settings.rgx_upper.test('this.prop')).to.be.false;
        });
    });

    describe("t4: multiple inheritance", function() {

        it("test basic inheritance principles", function() {
            var BH = new Type('basicHuman-t4')
                .properties({
                    ctor: function(name)
                    {
                        this.name = name;
                    },
                    p: 777,
                    m: function()
                    {
                        return 'bhm'
                    },
                    bhum: function()
                    {
                        return 'bhum'
                    }
                });

            var H = new Type('human-t4').inherits(BH)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    m: function()
                    {
                        return this._upper()+' hm'
                    },
                    hum: function()
                    {
                        return 'hum'
                    }
                });

            var BA = new Type('basicAlien-t4')
                .properties({
                    ctor: function(name)
                    {
                        this.name = name+'Alien';
                        this.bigblackeyes = true;
                    },
                    baum: function()
                    {
                        return 'baum'
                    },
                    baom: function()
                    {
                        // to test overriding in trait with superclass
                    },
                    bam: function()
                    {
                        return 'ba'
                    }
                });

            var A = new Type('alien-t4').inherits(BA)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    moa: function () {

                    },
                    aum: function()
                    {
                        return 'aum'
                    },
                    bam: function()
                    {
                        return this._upper()+' a'
                    }
                });

            var BI = new Type('basicInsect-t4')
                .properties({
                    ctor: function(name)
                    {
                        this.name    = name+'Insect';
                        this.antlers = true;
                    },
                    bium: {enumerable: false, value: function()
                    {
                        return 'bium'
                    }},
                    m: function() {

                    },
                    moa: function()
                    {

                    },
                    bim: function()
                    {
                        return 'bi'
                    }
                });

            var I = new Type('insect-t4').inherits(BI)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    ium: function()
                    {
                        return 'ium'
                    },
                    m: function() {
                        // check if console outputs '[constructing Type: hybrid-t4] prop m in trait insect-t4 is conflicting with super class and is not assigned'
                    },
                    bim: function()
                    {
                        return this._upper()+' i'
                    }
                });

            var HY = new Type('hybrid-t4').inherits(H, A, I)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    p: 666,
                    m: function()
                    {
                        return this._upper()+' hy'
                    },
                    baom: function()
                    {
                        // check if console outputs a warning: overriding baom in class hybrid but not using super
                    },
                    bam: function()
                    {
                        return this._upper()+' hy'
                    },
                    bim: function()
                    {
                        return this._upper()+' hy'
                    }
                });

            var HY2 = new Type('hybrid-t4').inherits(H).traits(A, I)
                .properties({
                    ctor: function(name)
                    {
                        this._upper(name);
                    },
                    p: 666,
                    m: function()
                    {
                        return this._upper()+' hy'
                    },
                    baom: function()
                    {
                        // check if console outputs a warning: overriding baom in class hybrid but not using super
                    },
                    bam: function()
                    {
                        return this._upper()+' hy'
                    },
                    bim: function()
                    {
                        return this._upper()+' hy'
                    }
                });

            var hy  = HY.spawn('unnoon');
            var hy2 = HY2.spawn('unnoon');

            expect(hy.name).to.deep.equal('unnoon');
            expect(hy.m()).to.deep.equal('bhm hm hy');
            expect(hy.bhum()).to.deep.equal('bhum');
            expect(hy.bium()).to.deep.equal('bium');
            expect(BI.propertyIsEnumerable('bium')).to.be.false;
            expect(HY.propertyIsEnumerable('bium')).to.be.false;
            expect(hy.hum()).to.deep.equal('hum');
            expect(hy.bam()).to.deep.equal('ba a hy');
            expect(hy.bim()).to.deep.equal('bi i hy');
            expect(hy.antlers).to.be.true;
            expect(hy.bigblackeyes).to.be.true;
            expect(BH.isPrototypeOf(hy)).to.be.true;
            expect(H.isPrototypeOf(hy)).to.be.true;
            expect(HY.isPrototypeOf(hy)).to.be.true;
            expect(console.warn.calledWith('[constructing Type: insect-t4] not calling upper in overriding property(value): m.')).to.be.true;

            expect(hy2.name).to.deep.equal('unnoon');
            expect(hy2.m()).to.deep.equal('bhm hm hy');
            expect(hy2.bhum()).to.deep.equal('bhum');
            expect(hy2.bium()).to.deep.equal('bium');
            expect(BI.propertyIsEnumerable('bium')).to.be.false;
            expect(HY.propertyIsEnumerable('bium')).to.be.false;
            expect(hy2.hum()).to.deep.equal('hum');
            expect(hy2.bam()).to.deep.equal('ba a hy');
            expect(hy2.bim()).to.deep.equal('bi i hy');
            expect(hy2.antlers).to.be.true;
            expect(hy2.bigblackeyes).to.be.true;
            expect(BH.isPrototypeOf(hy2)).to.be.true;
            expect(H.isPrototypeOf(hy2)).to.be.true;
            expect(HY2.isPrototypeOf(hy2)).to.be.true;

            expect(console.warn.calledWith('[constructing Type: insect-t4] not calling upper in overriding property(value): m.')).to.be.true;
            expect(console.warn.calledWith("[constructing Type: hybrid-t4] not assigning prop 'm' from trait 'insect-t4' due to conflicts with upper type")).to.be.true;
            expect(console.warn.calledWith("[constructing Type: hybrid-t4] not assigning prop 'moa' from trait 'insect-t4' due to conflicts with a previous trait")).to.be.true;
            expect(console.warn.calledWith("[constructing Type: hybrid-t4] not assigning prop 'm' from trait 'insect-t4' due to conflicts with upper type")).to.be.true;
            expect(console.warn.calledWith('[constructing Type: hybrid-t4] not calling upper in overriding trait property(value): baom.')).to.be.true;
            expect(console.warn.calledWith("[constructing Type: hybrid-t4] not assigning prop 'moa' from trait 'insect-t4' due to conflicts with a previous trait")).to.be.true;
            expect(console.warn.calledWith('[constructing Type: hybrid-t4] not calling upper in overriding trait property(value): baom.')).to.be.true;
        });
    });

    describe("t5: statics", function() {

        var BH = new Type('basicHuman-t5')
            .properties({
                ctor: function(name)
                {
                    this.name = name;
                },
                'static $static': 'electricty'
            });

        var bh = BH.spawn();

        it("check this._static", function() {

            expect(bh.$static).to.deep.equal('electricty');

            bh.$static = 'elektro';
            expect(bh.$static).to.deep.equal('elektro');
            expect(bh.hasOwnProperty('$static')).to.be.false;
            expect(bh.hasOwnProperty('_$static')).to.be.false;
        });
    });

    describe("t6: getter setter inheritance", function() {

        var BH = new Type('basicHuman-t6')
            .properties({
                ctor: function()
                {
                    this._x = 666;
                },
                get x()
                {
                    return this._x + 111
                },
                set x(val)
                {
                    return this._x = val + 222
                }
            });

        var H = new Type('human-t6').inherits(BH)
            .properties({
                ctor: function()
                {
                    this._upper();
                },
                get x()
                {
                    return this._upper() - 333
                },
                set x(val)
                {
                    this._x = this._upper(val) + 555
                }
            });

        var h = H.spawn();

        it("simple setter getter", function() {
            h.x = 111;
            expect(h._x).to.deep.equal(888);
            expect(h.x).to.deep.equal(666);
        });
    });

    describe("t7: private usage checking", function() {
        var throws = false;

        try {
            var H = new Type('human-t7')
                .properties({
                    ctor: function()
                    {
                        this._upper();
                    },
                    _privateMethod: function() {
                        return 'access'
                    },
                    testAccess: function() {
                        return this._privateMethod()
                    },
                    testAccess2: function() {
                        return H._privateMethod()
                    }
                });

            var h = H.spawn();
        }
        catch(e) {
            throws = e;
        }

        it("test private access", function() {
            expect(throws).to.equal('[constructing Type: human-t7]: illegal use of private property H._privateMethod in method: testAccess2');
        });
    });

    describe("t8: attributes", function() {

        var BH = new Type('basicHuman-t1')
            .properties({
                bhum: {},
                '!enumerable nep': {attrs: '!configurable', writable: false, value: 'nananana'}
            });

        it("test attributes", function() {
            expect(BH.hasOwnProperty('nep')).to.be.true;
            expect(BH.propertyIsEnumerable('nep')).to.be.false;
            expect(Object.getOwnPropertyDescriptor(BH, 'nep').configurable).to.be.false;
            expect(Object.getOwnPropertyDescriptor(BH, 'nep').writable).to.be.false;
        });

        it("test attributes negative case", function() {
            expect(BH.hasOwnProperty('bhum')).to.be.true;
            expect(BH.propertyIsEnumerable('bhum')).to.be.true;
            expect(Object.getOwnPropertyDescriptor(BH, 'bhum').configurable).to.be.true;
            expect(Object.getOwnPropertyDescriptor(BH, 'bhum').writable).to.be.true;
        });
    });

    describe("t9: create function", function() {

        var BH = new Type('basicHuman-t1')
            .properties({
                ctor: function(val) {
                    this.ctorProp = val;
                },
                stateProp: 666
            });

        var bh = BH.spawn(555);

        it("test attributes", function() {
            expect(bh.stateProp).to.deep.equal(666);
            expect(bh.hasOwnProperty('stateProp')).to.be.true;
            expect(Object.getPrototypeOf(bh)).to.deep.equal(BH);
            expect(bh.ctorProp).to.deep.equal(555);
            expect(bh.ctorProp).to.deep.equal(555);
            expect(bh.hasOwnProperty('ctorProp')).to.be.true;
        });
    });

    describe("t10: without new keyword", function() {

        var BH = Type('name').properties({
            stateProp: 666
        });

        var bh = BH.spawn(555);

        it("test attributes", function() {
            expect(bh.stateProp).to.deep.equal(666);
        });
    });
});

