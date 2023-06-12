var express = require('express');
var exphbs  = require('express-handlebars');
var port = process.env.PORT || 3000;

// SDK do Mercado Pago
const mercadopago = require('mercadopago');
// Adicione as credenciais
mercadopago.configure({
  access_token: 'APP_USR-2453313229452572-092911-2df2d24eb035a4c0852f3455a89d1459-1160953381'
});


var app = express();
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/checkout', function (req, res){
    console.log(req.query);
    res.render('checkout', req.query);
          
});

app.post('/notification', function (req, res){
    switch(req.query.topic){
        case 'merchant_order':
            const merchant_order = mercadopago.merchant_orders.findById(req.query.id);
            console.warn(mercadopago.merchant_order);
            break;
        case 'payment':
            const payment = mercadopago.payment.findById(req.query.id);
            console.warn(payment);
            break;
        default:
            console.warn(req.query);
            break;
    }
    console.log(req);
    res.json({success: 201});
    res.status(201).end();
});

app.get('/detail', function (req, res) {

    const { query } = req;
    const back_urls = `${req.protocol}://${req.headers.host}/checkout`;
    const notification_url = `${req.protocol}://${req.headers.host}/notification`;
    let preference = {
        items: [
            {
                title: query.title,
                picture_url: `${req.protocol}://${req.headers.host}/${query.img.replace(/^\.\//,'')}`,
                unit_price: Number.parseInt(query.price,0.0),
                quantity: Number.parseInt(query.unit,0)
            }
        ],
        notification_url: notification_url,
        back_urls: {
            success: back_urls,
            pending: back_urls,
            failure: back_urls,
        },
        payment_methods: {
            installments: 6,
            default_installments: 1
        },
        auto_return: 'approved',
    };

    console.log(preference);

    mercadopago.preferences.create(preference)
        .then(function(response){
            // Este valor substituirá a string "<%= global.id %>" no seu HTML
            global.id = response.body.id;
            res.render('detail', {id: response.body.id, ...req.query});
            
        }).catch(function(error){
            console.log(error);
        });

});

app.listen(port);