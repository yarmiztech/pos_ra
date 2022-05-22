odoo.define('pos_network_printer_not.Multiprint', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;
    var NetPrinter = require('pos_network_printer_not.Printer');
//    var NetPrinter = require('pos_network_printer_not.PrinterEzp');
    var current_printer = new NetPrinter();
     const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    var _super_orderline = models.Orderline.prototype
    models.load_fields('product.product', 'ar_name');
//    models.PosModel = models.PosModel.extend({
//        initialize: function(session, attributes){
//            var self = this;
// models.load_fields('product.product', 'ar_name');
//             _super_product.initialize.apply(this, arguments);
//        }
//    });
    models.Orderline = models.Orderline.extend({
        initialize: function(session, attributes){
            var self = this;
            models.load_fields('pos.order.line', ['new_field']);
            _super_orderline.initialize.apply(this, arguments);
        }
    });
//    models.Orderline = models.Orderline.extend({
//
//         initialize: function (attr, options) {
//          models.Orderline.load_fields('product.product', ['new_field']);
////            this.ar_name = '';
//            _super_orderline.initialize.apply(this, arguments);
//        },
//        })
    models.Order = models.Order.extend({
      build_line_resume: function(){
        var resume = {};
        this.orderlines.each(function(line){
            if (line.mp_skip) {
                return;
            }
            debugger;
            var line_hash = line.get_line_diff_hash();
            var ar_name = line.product.ar_name;
            var price = line.price;
            var qty  = Number(line.get_quantity());
            var note = line.get_note();
            var product_id = line.get_product().id;

            if (typeof resume[line_hash] === 'undefined') {
                resume[line_hash] = {
                    qty: qty,
                    note: note,
                    product_id: product_id,
                    ar_name: ar_name,
                    price: price,
                    product_name_wrapped: line.generate_wrapped_product_name(),
                };
            } else {
                resume[line_hash].qty += qty;
            }

        });
        console.log(resume,'resume')
        return resume;
    },
    saveChanges: function(){
        this.saved_resume = this.build_line_resume();
        this.orderlines.each(function(line){
            line.set_dirty(false);
        });
        this.trigger('change',this);
    },




        computeChanges: function(categories){
        console.log('MIne')
        debugger;
        var current_res = this.build_line_resume();
        var old_res     = this.saved_resume || {};
        var json        = this.export_as_JSON();
        var add = [];
        var rem = [];
        var line_hash;
        debugger;

        for ( line_hash in current_res) {
            var curr = current_res[line_hash];
            var old  = {};
            var found = false;
            for(var id in old_res) {
                if(old_res[id].product_id === curr.product_id){
                    found = true;
                    old = old_res[id];
                    break;
                }
            }

            if (!found) {
                debugger;
                console.log(json,'json')
                 var product_name ='            '+curr.product_name_wrapped[0];
                if(this.pos.db.get_product_by_id(curr.product_id).ar_name){
                    product_name +='-'+this.pos.db.get_product_by_id(curr.product_id).ar_name
                }
                add.push({
                    'id':       curr.product_id,
//                    'name':     '  '+this.pos.db.get_product_by_id(curr.product_id).display_name+'('+this.pos.db.get_product_by_id(curr.product_id).ar_name+')',
//                    'name':     '  '+curr.product_name_wrapped[0]+'-'+this.pos.db.get_product_by_id(curr.product_id).ar_name,
                    'name': product_name,
//                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name+'81',
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
//                    'ar_name':     this.pos.db.get_product_by_id(curr.product_id).ar_name,
                    'price':   curr.price,
                    'qty':  'Qty :'+curr.qty+'      SR:'+curr.price,
                });
            } else if (old.qty < curr.qty) {
                debugger;
                console.log(json,'json')
//                for(var i = 0; i < rem.length; i++){
//
//                }
                var qty = curr.qty - old.qty
                var qty_new = 'Qty :'+qty+'     SR:'+curr.price
                var product_name ='             '+curr.product_name_wrapped[0];
                if(this.pos.db.get_product_by_id(curr.product_id).ar_name){
                    product_name +='-'+this.pos.db.get_product_by_id(curr.product_id).ar_name
                }
                add.push({
                    'id':       curr.product_id,
//                    'name':     '  '+this.pos.db.get_product_by_id(curr.product_id).display_name+'('+this.pos.db.get_product_by_id(curr.product_id).ar_name+')',
//                    'name':     '  '+curr.product_name_wrapped[0]+'-'+this.pos.db.get_product_by_id(curr.product_id).ar_name,
                    'name':  product_name,
//                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name+'82',
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
//                     'ar_name':     this.pos.db.get_product_by_id(curr.product_id).ar_name,
                     'price':   curr.price,
//                    'qty':      curr.qty - old.qty ,
                    'qty':     qty_new,
                });
            } else if (old.qty > curr.qty) {
                 debugger;
                 var qty = old.qty - curr.qty
                var qty_new =  'Qty :'+qty+'   SR:'+old.amount_total
                console.log(json,'json',this.pos.db.get_product_by_id(curr.product_id).ar_name)
                 var product_name ='             '+curr.product_name_wrapped[0];
                if(this.pos.db.get_product_by_id(curr.product_id).ar_name){
                   product_name +='-'+this.pos.db.get_product_by_id(curr.product_id).ar_name
                }
                rem.push({
                    'id':       curr.product_id,
//                    'name':     '  '+curr.product_name_wrapped[0]+'-'+this.pos.db.get_product_by_id(curr.product_id).ar_name,
                    'name':product_name,
//                    'name':     '  '+this.pos.db.get_product_by_id(curr.product_id).display_name+'('+this.pos.db.get_product_by_id(curr.product_id).ar_name+')',
//                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name+'83',
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
//                    'ar_name':     this.pos.db.get_product_by_id(curr.product_id).ar_name,
//                    'qty':      old.qty - curr.qty,
                    'qty':     qty_new,
                    'price':   curr.price,
                });
            }
        }

        for (line_hash in old_res) {
            var found = false;
            for(var id in current_res) {
                if(current_res[id].product_id === old_res[line_hash].product_id)
                    found = true;
            }
            if (!found) {
                var old = old_res[line_hash];
                var qty = old.qty
                var qty_new = 'Qty :'+qty+'   SR '+json.amount_total
                var product_name ='             '+old.product_name_wrapped[0];
                if(this.pos.db.get_product_by_id(old.product_id).ar_name){
                   product_name +='-'+this.pos.db.get_product_by_id(old.product_id).ar_name
                }
                rem.push({
                    'id':       old.product_id,
//                    'name':     '  '+this.pos.db.get_product_by_id(old.product_id).display_name+'('+this.pos.db.get_product_by_id(old.product_id).ar_name+')',
//                    'name':     '  '+old.product_name_wrapped[0]+'-'+this.pos.db.get_product_by_id(old.product_id).ar_name,
                    'name': product_name,
//                    'name':     this.pos.db.get_product_by_id(old.product_id).display_name+'84',
                    'name_wrapped': old.product_name_wrapped,
                    'note':     old.note,
//                    'ar_name':     this.pos.db.get_product_by_id(curr.product_id).ar_name,
//                    'qty':      old.qty,
                    'qty':     qty_new,
//                    'price':   json.amount_total,
                    'price':  old.price,
                });
            }
        }

        if(categories && categories.length > 0){
            // filter the added and removed orders to only contains
            // products that belong to one of the categories supplied as a parameter

            var self = this;

            var _add = [];
            var _rem = [];

            for(var i = 0; i < add.length; i++){
                if(self.pos.db.is_product_in_category(categories,add[i].id)){
                    _add.push(add[i]);
                }
            }
            add = _add;

            for(var i = 0; i < rem.length; i++){
                if(self.pos.db.is_product_in_category(categories,rem[i].id)){
                    _rem.push(rem[i]);
                }
            }
            rem = _rem;
        }

        var d = new Date();
        var hours   = '' + d.getHours();
            hours   = hours.length < 2 ? ('0' + hours) : hours;
        var minutes = '' + d.getMinutes();
            minutes = minutes.length < 2 ? ('0' + minutes) : minutes;
        debugger;
        var date_complete = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'|'+d.getHours()+':'+d.getMinutes();

        return {
            'new': add,
            'cancelled': rem,
            'table': json.table || false,
            'floor': json.floor || false,
            'name': json.name  || 'unknown order',
            'time': {
                'hours':   hours,
                'minutes': minutes,
                'date_complete': date_complete,
            },
//            'price':   json.amount_total,
//            'ar_name':     this.pos.db.get_product_by_id(curr.product_id).ar_name,
        };

    },


        printChanges: async function () {
            var self = this;
            self.arabic_data =[];
//            self.ar_name ='';
            var printers = this.pos.printers;
            let isPrintSuccessful = true;
            for (var i = 0; i < printers.length; i++) {
                debugger;
                var changes = this.computeChanges(printers[i].config.product_categories_ids);
//                changes.arabic_data =[]
//                console.log(changes,'changes');
//                for (var k = 0; k < this.orderlines.models.length; k++){
//                changes.ar_name = this.orderlines.models[k].product.ar_name
//                var arabic_data = {
//                    "ar_name": this.orderlines.models[k].product.ar_name,
//                };
//                self.arabic_data.push(arabic_data)
//                changes.arabic_data.push(arabic_data)
//                }
//                changes.push(arabic_data)


                if (changes['new'].length > 0 || changes['cancelled'].length > 0) {
                    debugger;
                    var receipt = QWeb.render('OrderChangeReceiptCustom', {changes: changes, widget: this});
                    console.log(receipt,'receipt')
                    if (printers[i].config.printer_type == "nt_printer") {
                        debugger;
                        console.log(changes,'changes')
                        if (self.pos.config.printing_mode == 'offline') {
                            console.log('mou1')
                            current_printer.print_offline_kot(self, receipt, printers[i].config);
                        }
                        if (self.pos.config.printing_mode == 'online') {
                            console.log('mou2')
                            if (self.pos.config.connector == 'jspm') {
                                current_printer.print_jspm_kot(changes, printers[i].config);
                            }
                            if (self.pos.config.connector == 'websocket') {
                                console.log('mou3')
                                current_printer.print_websocket_kot(self, receipt, printers[i].config);
                            }
                            if (self.pos.config.connector == 'printc') {
                                current_printer.print_online_kot(changes, printers[i].config, receipt, self);
                            }
                        }
                    } else {
                        const result = await printers[i].print_receipt(receipt);
                        console.log(result,'result')
                        if (!result.successful) {
                            isPrintSuccessful = false;
                        }
                    }
                }
            }
            return isPrintSuccessful;
        }

    });

});
