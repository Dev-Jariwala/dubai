if (process.env.NODE_ENV !== 'production') { require('dotenv').config() }

//  Importing libraries..............
const express = require('express')
const app = express()
const path = require("path");
require('./db/conn')
const { UserData, ProductData } = require('./models/schema')
const bcrypt = require('bcrypt')
const initializePassport = require('./passport-config')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
initializePassport(passport)
const port = process.env.PORT || 3000

const publicPath = path.join(__dirname, './public');

// const users = [];
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.set('view engine', 'ejs');
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//  Routes.........................
app.get('/', checkAuthenticated, (req, res) => {
    const products = ProductData.find((err, docs) => {
        if (!err) {
            res.render("index", {
                data: docs,
                user: {
                    fname: req.user.fname
                },
                cart: req.user.cartProducts,
            });
        } else {
            console.log('Failed to retrieve the Course List: ' + err);
        }
    }).sort({ price: 1 });

})


app.get('/login', checkNOTAuthenticated, (req, res) => {
    res.render('login')
})
app.post('/login', checkNOTAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,

}))

app.get('/register', checkNOTAuthenticated, (req, res) => {
    res.render('register')
})
app.post('/register', checkNOTAuthenticated, async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;

        if (password === cpassword) {
            const hashedPassword = await bcrypt.hash(password, 10)
            const registerUser = new UserData({
                fname: req.body.fname,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword,
                cpassword: hashedPassword,
                cartProducts: [],
            });

            const result = await registerUser.save();
            res.redirect('login')
        } else {
            req.flash('notMatched', 'Enter same passwords')
            res.redirect("register")
        }
    } catch (error) {
        res.redirect('register')
    }
})
app.delete('/logout', checkAuthenticated, (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err)
        res.redirect('/')
    })
})
app.post('/checkout', (req, res) => {
    const PaytmChecksum = require('paytmchecksum');

    const getTotalPrice = (items) => items
        .map((item) => item.price * item.quantity)
        .reduce((acc, value) => acc + value, 0)

    const result = getTotalPrice(req.user.cartProducts);
    const paymentDetails = {
        amount: result,
        customerId: req.user.id,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
    }
    const params = {};
    params['MID'] = 'RtZYvX44163568075252';
    params['ORDER_ID'] = 'Test_' + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['WEBSITE'] = 'DEFAULT';
    params['MOBILE_NO'] = paymentDetails.customerPhone;
    params['CALLBACK_URL'] = 'https://127.0.0.1:3000/callback';
    const paytmMerchantKey = '4vnQ09l9aHZzM1X%';

    PaytmChecksum.generateSignature(params, paytmMerchantKey).then(function (checksum) {
        console.log(checksum);
    }).catch(function (error) {
        console.log(error);
    });
    res.redirect('/cart')
})
app.get('/cart', checkAuthenticated, (req, res) => {
    const getTotalPrice = (items) => items
        .map((item) => item.price * item.quantity)
        .reduce((acc, value) => acc + value, 0)

    const result = getTotalPrice(req.user.cartProducts);
    const cartProducts = req.user.cartProducts;
    const sortedProducts = cartProducts.sort(
        (p1, p2) => (p1.price < p2.price) ? 1 : (p1.price > p2.price) ? -1 : 0);
    res.render('cart', {
        data: sortedProducts,
        user: {
            fname: req.user.fname,
        },
        total: result,
    })

})
app.post('/quantity/(:id)', checkAuthenticated, async (req, res) => {
    try {
        const quantity = req.body.quantity;
        const _id = req.params.id;
        const array = req.user.cartProducts;
        const object = array.find(obj => obj._id === _id);
        object.quantity = quantity;
        function removeObjectWithId(arr, id) {
            return arr.filter((obj) => obj._id !== id);
        }
        const newArr = removeObjectWithId(array, _id);
        newArr.push(object);

        const updateObject = await UserData.updateOne({ _id: req.user.id }, {
            cartProducts: newArr
        }).sort({ price: -1 });
        res.redirect('/cart');

    } catch (error) {
        console.log(error);
    }
})
app.get('/remove/(:id)', checkAuthenticated, async (req, res) => {
    try {
        const array = req.user.cartProducts;
        // finding the object whose id is '3'
        const object = array.find(obj => obj._id === req.params.id);

        // printing object on the console
        // console.log(object);
        function removeObjectWithId(arr, id) {
            return arr.filter((obj) => obj._id !== id);
        }
        const newArr = removeObjectWithId(array, req.params.id);

        const updateCart = await UserData.updateOne({ _id: req.user.id }, {
            cartProducts: newArr
        })
        res.redirect('/cart');


    } catch (error) {
        console.log(error);
    }
})
app.get('/cart/(:id)', checkAuthenticated, async (req, res) => {
    try {

        ProductData.findById(req.params.id, async (err, doc) => {
            try {
                if (!err) {
                    const editUserName = await UserData.updateOne({ _id: req.user.id }, {
                        $addToSet: {
                            cartProducts: {
                                _id: doc.id,
                                img: doc.img,
                                pname: doc.pname,
                                pdetails: doc.pdetails,
                                price: doc.price,
                                size: doc.size,
                                quantity: 1,
                            }
                        }
                    }).sort({ price: -1 });

                    res.redirect('/cart');
                } else {
                    console.log(err);
                }
            } catch (error) {
                console.log(error);
            }

        })

    } catch (error) {
        res.send(error);
    }

})

// deleting product from Product List
app.get('/delete/(:id)', function (req, res, next) {
    ProductData.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            res.redirect('/viewproducts')
        } else {
            console.log(err)
        }
    })
})

// socasing all available product list
app.get('/products', (req, res) => {
    const products = ProductData.find((err, docs) => {
        if (!err) {
            res.render("products", {
                data: docs
            });
        } else {
            console.log('Failed to retrieve the Course List: ' + err);
        }
    });
})

// from here only admin can add new products and delete out of stock products..
app.get('/viewproducts', (req, res) => {
    const products = ProductData.find((err, docs) => {
        if (!err) {
            res.render("viewproducts", {
                data: docs
            });
        } else {
            console.log('Failed to retrieve the Course List: ' + err);
        }
    });
})
// page to add products by admin
app.get('/addproducts', (req, res) => {
    res.render('addproducts')
})
app.post('/addproducts', async (req, res) => {
    try {
        const addproduct = new ProductData({
            img: req.body.img,
            pname: req.body.pname,
            pdetails: req.body.pdetails,
            price: req.body.price,
            size: req.body.size,
            stock: req.body.stock,
        });

        const result = await addproduct.save();
        res.redirect('/viewproducts')
    } catch (error) {
        res.redirect('/addproducts')
    }
})
//  End routes......................

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}
function checkNOTAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(port, () => {
    console.log(`Listining on the port ${port}....`)
})