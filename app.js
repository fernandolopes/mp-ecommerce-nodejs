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

    let data = {merchant_order_id: req.query.merchant_order_id};

    switch(req.query.collection_status) {
        case 'approved':
            data['collection_status'] = 'Compra Aprovada';
            data['color'] = '#41e141';
            break;
        case 'pending':
            data['collection_status'] = 'Aguardando Aprovação';
            data['color'] = '#e1416c';
            break;
        default:
            data['collection_status'] = 'Compra não aprovada';
            data['color'] = '#e19141';
            break;
    }

    switch(req.query.payment_type){
        case 'credit_card':
            data['payment_type'] = 'Compra com cartão de crédito';
            break;
        case 'debit_card':
            data['payment_type'] = 'Compra com Cartão de débito';
            break;
        default:
            data['payment_type'] = 'Outro';
            break;
    }

    res.render('checkout', data);
          
});

app.post('/notification', function (req, res){
    try {
        switch(req.query.topic){
            case 'merchant_order':
                mercadopago.merchant_orders.findById(req.query.id)
                    .then(function(merchant_order){
                        console.warn(merchant_order);
                        res.json({success: 201});
                    }).catch(function(error){
                        console.error(error);
                        res.json({success: 404});
                        res.status(404).end();
                    });
                
                break;
            case 'payment':
                mercadopago.payment.findById(req.query.id)
                    .then(function(payment){
                        console.warn(payment);
                        //console.log("[BODY] "+req.body);
                        res.json({success: 201});
                    }).catch(function(error){
                        console.error(error);
                        res.json({success: 404});
                        res.status(404).end();
                    });
                
                break;
            default:
                console.warn(req.query);
                res.json({success: 201});
                break;
        }
    } catch(e) {
        res.json({success: 404});
        res.status(404).end();
        console.error(e);
    }
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