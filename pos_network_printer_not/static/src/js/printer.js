odoo.define('pos_network_printer_not.Printer', function (require) {
    'use strict';
    var core = require('web.core');
//    var codepage = require('codepage');
    var Registries = require('point_of_sale.Registries');
//    var mixins = require('point_of_sale.Printer');
    var mixins = require('pos_network_printer_not.PrinterEzp');
//    var EscPos =require('point_of_sale.xml-parser');
//    var ReceiptScreen = require('point_of_sale.ReceiptScreen');
    var ReceiptScreen = require('point_of_sale.ReceiptScreen');
    var ProductScreen = require('point_of_sale.ProductScreen');
    const {_t} = require('web.core');
    var QWeb = core.qweb;
    var OrderReceipt = require('point_of_sale.OrderReceipt');
    const {useRef, useContext} = owl.hooks;
//    var NetPrinter = require('pos_network_printer_not.Printer');


    var Printer = core.Class.extend(mixins.PrinterMixin, {

        init: function () {
            debugger;
            mixins.PrinterMixin.init.call(this, arguments);
            this.widget = this;
        },


        jspmWSStatus: function () {
            debugger;
            if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Open)
                return true;
            else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Closed) {
                console.warn('JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App from https://neodynamic.com/downloads/jspm');
                return false;
            }
            else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Blocked) {
                alert('JSPM has blocked this website!');
                return false;
            }
        },

        print_offline: function (widget, receipt, printer) {
            debugger;
            var self = this;
            var order = widget.env.pos.get_order();
            var receipt_data = {
                "uid": order.uid,
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "receipt": receipt
            };
            var receipt_db = widget.env.pos.db.load('receipt', []);
            receipt_db.push(receipt_data);
            widget.env.pos.db.save('receipt', receipt_db);

            var data = {
                "jsonrpc": "2.0",
                "params": receipt_data
            }
            $.ajax({
                dataType: 'json',
                headers: {
                    "content-type": "application/json",
                    "cache-control": "no-cache",
                },
                url: '/print-network-xmlreceipt',
                type: 'POST',
                proccessData: false,
                data: JSON.stringify(data),
                success: function (res) {
                    var data = JSON.parse(res.result);
                    if (data.error == 0) {
                        self.remove_printed_order(widget, data.uid);
                    }
                    if (data.error == 1) {
                        widget.pos.set({printer: {state: 'disconnected'}, spooler: {state: 'connecting'}});
                    }
                }
            });
        },
        print_online: function (widget, printer) {
            debugger;
            var self = this;
            var order = widget.env.pos.get_order();
            var queue_print_data = {
                "printer_name": printer.printer_name,
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "connector_id": printer.connector_id[0],
                "receipt": receipt,
                "token": self.get_connector_token(widget, printer),
            }
            widget.env.pos.rpc({
                model: 'queue.print',
                method: 'create',
                args: [queue_print_data]
            }).then(function (result) {
                console.log('new queue created ' + 1);
            });
        },
        print_jspm: function (widget, ticketImage, printer) {
            console.log(widget,ticketImage,printer,'===================')
            debugger;
            var self = this;
            var escpos = Neodynamic.JSESCPOSBuilder;
            var doc = new escpos.Document();

            ticketImage.then(function (b64img) {
                console.log(b64img,'b64img')
                escpos.ESCPOSImage.load("data:image/png;base64," + b64img).then(img => {
                    var escposCommands = doc
                        .image(img)
                        .feed(5)
                        .cut()
                        .generateUInt8Array();

                    if (self.jspmWSStatus()) {
                        var myPrinter = new JSPM.NetworkPrinter(parseInt(printer.printer_port), printer.printer_ip, printer.printer_name);
                        var cpj = new JSPM.ClientPrintJob();
                        cpj.clientPrinter = myPrinter;
                        cpj.binaryPrinterCommands = escposCommands;
                        cpj.sendToClient();
                    }
                })

            });

        },
        remove_printed_order: function (widget, uid) {
            var receipt_db = widget.env.pos.db.load('receipt', []);
            var printed_receipt = receipt_db.pop();
            if (printed_receipt.uid != uid) {
                receipt.push(printed_receipt);
            }
            widget.env.pos.db.save('receipt', receipt_db);
        },
        get_connector_token: function (widget, printer) {
            debugger;
            var connector = _.filter(widget.env.pos.printer_connectors, function (line) {
                return line.id == printer.connector_id[0]
            });
            return connector[0].token;
        },
        print_offline_kot: function (widget, receipt, printer) {
            var self = this;
            var order = widget.pos.get_order();
            var receipt_data = {
                "uid": order.uid,
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "receipt": receipt
            };
            var receipt_db = widget.pos.db.load('receipt', []);
            receipt_db.push(receipt_data);
            widget.pos.db.save('receipt', receipt_db);

            var data = {
                "jsonrpc": "2.0",
                "params": receipt_data
            }
            $.ajax({
                dataType: 'json',
                headers: {
                    "content-type": "application/json",
                    "cache-control": "no-cache",
                },
                url: '/print-network-xmlreceipt',
                type: 'POST',
                proccessData: false,
                data: JSON.stringify(data),
                success: function (res) {
                    var data = JSON.parse(res.result);
                    if (data.error == 0) {
                        self.remove_printed_order_kot(widget, data.uid);
                    }
                    if (data.error == 1) {
                        widget.pos.set({printer: {state: 'disconnected'}, spooler: {state: 'connecting'}});
                    }
                }
            });
        },
        print_online_kot: function (changes, printer) {
            var self = this;
            var order = widget.pos.get_order();
            var queue_print_data = {
                // "uid": order.uid,
                "printer_name": printer.name,
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "connector_id": printer.connector_id[0],
                "receipt": receipt,
                "token": self.get_connector_token_kot(widget, printer),
            }
            widget.pos.rpc({
                model: 'queue.print',
                method: 'create',
                args: [queue_print_data]
            }).then(function (result) {
                console.log('new queue created ' + 1);
            });
        },
//        print_jspm_kot: function (changes, printer) {
//            debugger;
////            console.log(codepage,'js-codepage')
//            var self = this;
//            var escpos = Neodynamic.JSESCPOSBuilder;
//            var doc = new escpos.Document();
//            debugger;
//            var escposCommands = doc
//                .font(escpos.FontFamily.A)
//                .align(escpos.TextAlignment.Center)
//                .size(0, 0)
//                .text(changes.name  + changes.time.hours + ':' + changes.time.minutes);
//
//            if (changes.new.length > 0) {
//                escposCommands = escposCommands
//                    .align(escpos.TextAlignment.LeftJustification)
//                    .size(1, 1)
//                    .text(' NEW');
//            }
//            for (var i = 0; i < changes.new.length; i++) {
//                changes.new[i].name_wrapped[0] = ' '+changes.new[i].name_wrapped[0]
//                escposCommands = escposCommands
//                    .size(0, 0)
////                    .drawTable([changes.new[i].name, changes.new[i].qty])
//
//
//                    .drawTable([changes.new[i].name_wrapped[0], changes.new[i].qty])
//            }
//            escposCommands = escposCommands.text(' ');
//            if (changes.cancelled.length > 0) {
//                escposCommands = escposCommands
//                    .align(escpos.TextAlignment.LeftJustification)
//                    .size(1, 1)
//                    .text(' CANCELLED');
////                    .setCharacterCodeTable(32) // PC737 from EPSON CodePage
////                    .setCharacterCodeTable(14) // PC720 from EPSON CodePage
//
////                         .text (420,"سلام");
////                         .text ("سلام");
//            }
//            for (var i = 0; i < changes.cancelled.length; i++) {
//                changes.cancelled[i].name_wrapped[0] = ' '+changes.cancelled[i].name_wrapped[0]
//                escposCommands = escposCommands
//                    .size(0, 0)
////                    .drawTable([changes.cancelled[i].name, changes.cancelled[i].qty])
//                    .drawTable([changes.cancelled[i].name_wrapped[0], changes.cancelled[i].qty])
//            }
//
//            escposCommands = escposCommands
//                .feed(3)
//                .cut()
//                .generateUInt8Array();
//
////            var cmds =  "\xef\xbb\xbf"; //UTF8 BOM!
////                cmds += "^XA";
////                cmds += "^CWZ,E:TT0003M_.FNT^FS";
////                cmds += "^FO10,50^CI28^AZN,50,50^FDUNICODE using CI28 UTF-8 encoding^FS";
////                cmds += "^FO010,160^CI28^AZN,50,40^FD- Roman: ABCDEFGHIJKLMNOPQRSTUVWXYZ^FS";
////                cmds += "^FO010,230^CI28^AZN,50,40^FD- Cyrillic: ЁЂЃЄЅІЇЈЉЊЋЌЎЏАБВГДЕЖЗИЙКЛМН^FS";
////                cmds += "^FO010,300^CI28^AZN,50,40^FD- Eastern: ŠŚŤŽŹŁĄŞŻĽľŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎ^FS";
////                cmds += "^FO010,370^CI28^AZN,50,40^FD- Greek: ΆΈΉΊΌΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΪΫ^FS";
////                cmds += "^FO010,440^CI28^AZN,50,40^FD- Turkish: ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎĞÑÒÓÔÕÖ×ØÙÚÛÜİŞ^FS";
////                cmds += "^PA1,1,1,1^FS"; //^PA command is mandatory for RTL Languages like Arabic & Hebrew
////                cmds += "^FO010,510^CI28^AZN,50,40^FD- Arabic: زيبرة  تكنوليجيز اوربا المحدودة^FS";
////                cmds += "^PQ1";
////                cmds += "^XZ";
//////                cpj.printerCommands = cmds;
////                escposCommands = cmds
////                //Send print job to printer!
//////            cpj.sendToClient();
//
//            if (self.jspmWSStatus()) {
//                var myPrinter = new JSPM.NetworkPrinter(parseInt(printer.printer_port), printer.printer_ip, printer.printer_name);
//                var cpj = new JSPM.ClientPrintJob();
//                cpj.clientPrinter = myPrinter;
//                console.log(escposCommands,'escposCommands')
//                cpj.binaryPrinterCommands = escposCommands;
//                cpj.sendToClient();
//            }
//
//        },
        print_jspm_kot: function (changes, printer) {
            debugger;
            console.log(changes,'444')
            var self = this;
            var escpos = Neodynamic.JSESCPOSBuilder;
            var doc = new escpos.Document();
            debugger;
//            var escposCommands = doc
//                .font(escpos.FontFamily.A)
//                .align(escpos.TextAlignment.Center)
//                .size(0, 0)
//                .text(changes.name  + changes.time.hours + ':' + changes.time.minutes);
//            var receipt = QWeb.render('OrderChangeReceiptCustom', {changes: changes, widget: self});
//            const textEncoder = new TextEncoder();
//            const name_byte_array = encodingName.encode(receipt);
//            const name_tag_encoding = [tag];
//            var receiptString = receipt;
//            console.log(receiptString,'test',self)
//            const ticketImage = self.htmlToImg(receipt);
//            console.log('name_byte_array',name_byte_array)
//
//            const ticketImage = self.htmlToImg(receipt);
//            const ticketImage ='IlxuICAgICAgICA8ZGl2IGNsYXNzPVwicG9zLXJlY2VpcHRcIj5cbiAgICAgICAgICAgIEhlbGxvb29vb29vb29vb29vb29vb29vb29vbyEhISEhISEhIVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBvcy1yZWNlaXB0LW9yZGVyLWRhdGFcIj4yMjIyMk9yZGVyIDAwMTIzLTAwMS0wMDAxPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxici8+XG4gICAgICAgICAgICA8YnIvPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicG9zLXJlY2VpcHQtdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgeXl5eXl5eXl5eXl5XG4gICAgICAgICAgICAgICAgICAgIE5FV1xuICAgICAgICAgICAgICAgICAgICAwMDoyOVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxici8+XG4gICAgICAgICAgICAgICAgPGJyLz5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm11bHRpcHJpbnQtZmxleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeHh4eHh4eHh4eHh4eHhcbiAgICAgICAgICAgICAgICAgICAgICAgIFF0eSA6MSAgICAgIEFtdDoxXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5ORVcgUFJPRFVDVCAoU21hbGwpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8YnIvPlxuICAgICAgICAgICAgICAgIDxici8+XG4gICAgICAgICAgICBcbiAgICAgICAgPC9kaXY+XG4gICAgIg==';

//            const ticketImage = self.print_receipt(receipt)
//            console.log('ticketImage',ticketImage)
//            const ticketImage = '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';
//            ticketImage.then(function (b64img) {
//            console.log(b64img,'b64img')
//            const ticketImage = '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';
//            var receipt = '';
//
//            var receipt += '       '+changes.name  + changes.time.hours + ':' + changes.time.minutes+"<br/>"
////            receipt+="'0x0A'"
//
//            for (var i = 0; i < changes.new.length; i++) {
//                changes.new[i].name = ' '+changes.new[i].name
//                receipt += changes.new[i].name
//                receipt += changes.new[i].qty
////                if (changes.new[i].price){
////                 receipt += changes.new[i].price}
//                }
//            for (var i = 0; i < changes.cancelled.length; i++) {
//                 receipt +=changes.cancelled[i].name
//                 receipt += changes.cancelled[i].qty
////                 if (changes.cancelled[i].price){
////                 receipt += changes.cancelled[i].price}
//            }
//            console.log(receipt,'receiptreceiptreceipt')


            var canvas = document.createElement("canvas");
            canvas.width = 1300;
            canvas.height = 200;

            var ctx = canvas.getContext('2d');

//            ctx.font = "30px Arial";
//            var text =receipt;
//            ctx.fillText(text,10,50);
//            let text = "Hello World \n Hello World 2222 \n AAAAA \n thisisaveryveryveryveryveryverylongword. "


//            var receipt = '     '+changes.name  +'-'+ changes.time.hours + ':' + changes.time.minutes
//            var receipt = '          '+changes.name.split('-')[2]+'('+changes.time.date_complete+')'
            var receipt = '          '+changes.name.split('-')[2]
            receipt+='\n'

            for (var i = 0; i < changes.new.length; i++) {
//                changes.new[i].name = changes.new[i].name
                receipt += changes.new[i].name+'    '
//                for (var j = 0; j < changes.new[i].name.split('-').length; j++) {
//                    receipt += changes.new[i].name.split('-')[j]
//                    receipt+='\n'
//                    }

                receipt+='\n'
                if (changes.new[i].note.match(/[a-z]/i)){
                receipt += changes.new[i].note+'    '
                receipt+='\n'
                }
                receipt += changes.new[i].qty
                receipt+='\n'
//                if (changes.new[i].price){
//                 receipt += changes.new[i].price}
                }
            for (var i = 0; i < changes.cancelled.length; i++) {
                 receipt +=changes.cancelled[i].name+'    '
                 receipt+='\n'
//                  for (var j = 0; j < changes.cancelled[i].name.split('-').length; j++) {
//                    receipt += changes.cancelled[i].name.split('-')[j]
//                    receipt+='\n'
//                    }
                 if (changes.cancelled[i].note.match(/[a-z]/i)){
                 receipt += changes.cancelled[i].note
                 receipt+='\n'
                 }
                 receipt += changes.cancelled[i].qty
                 receipt+='\n'
//                 if (changes.cancelled[i].price){
//                 receipt += changes.cancelled[i].price}
            }

            ctx.font = "25px Arial";
            var text = receipt
            ctx.clearRect(0, 0, 20, 20);
            fillTextCenter(ctx, text, 0, 0, 490, 200)
            function fillTextCenter(ctx, text, x, y, width, height) {
                debugger;
                ctx.textBaseline = 'middle';
                ctx.textAlign = "center";

                const lines = text.match(/[^\r\n]+/g);
                var k=0;
                for(let i = 0; i < lines.length; i++) {
                    if(i == 0){
                    let xL = (width - x) / 2
                    let yL =  y + (height / (lines.length + 1)) * (i+1)
                    ctx.font = "40px Arial";
                    ctx.fillText(lines[i], xL, yL)
                    }
                    if(i != 0){
                     if(lines[i].indexOf('SR:') ==-1){
                     if(lines[i]){
//                    if (k==0){
//                        k=0+i;
                        let xL = (width - 150) / 2
                        let yL =  y + (height / (lines.length + 1)) * (i+1)
                        ctx.font = "32px Arial";
                        ctx.fillText(lines[i], xL, yL)
//                        ctx.textAlign = 'center';
}
                        }
//                    else{
//                    if (k!=0){
                    if (lines[i].indexOf('SR:') >-1){
                        k=0;
                        let xL = (width + 250) / 2
                        let yL =  y + (height / (lines.length + 1)) * (i+1)
                        console.log(yL,'yL')
                        ctx.font = "23px Arial";
                        ctx.fillText(lines[i], xL, yL)
                        }
//                    }

                    }
                }
            }
            var img = document.createElement("img");
            img.src=canvas.toDataURL();
            console.log(img,'img')
            var img_mou = img.src


//            $("#show_img_here").append(img);
//            const ticketImage = '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';

//            let img = new Image();
//                img.crossOrigin = "Anonymous";
//                img.onload = () => {
//                    let canvas = document.createElement('canvas');
//                    canvas.width = img.width;
//                    canvas.height = img.height;
//                    let context = canvas.getContext('2d');
//                    context.drawImage(img, 0, 0);
//                    let pixels = context.getImageData(0, 0, img.width, img.height);
//                    ok({ data: new Uint8Array(pixels.data), shape: [img.width, img.height, 4], stride: [4, 4 * img.width, 1] });
//                };
//                img.onerror = (e) => { err(e); };
//                img.src = b64_image;
//            img_mou+=img_mou
            escpos.ESCPOSImage.load(img_mou).then(img => {
            var escposCommands = doc
                .image(img)
                .feed(5)
                .cut()
                .generateUInt8Array();

                if (self.jspmWSStatus()) {
                    var myPrinter = new JSPM.NetworkPrinter(parseInt(printer.printer_port), printer.printer_ip, printer.printer_name);
                    var cpj = new JSPM.ClientPrintJob();
                    cpj.clientPrinter = myPrinter;
                    cpj.binaryPrinterCommands = escposCommands;
                    cpj.sendToClient();
                }
                })

    //            });


    //
//
        },
        print_websocket: function (widget, receipt, printer) {
            var self = this;
            var receipt_data = JSON.stringify({
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "xmlreceipt": receipt,
                "origin": window.location.origin,
            });
            var client_app_ip = widget.env.pos.config.client_app_ip;
            var client_app_port = widget.env.pos.config.client_app_port;
            var url = "http://"+client_app_ip+":"+client_app_port;
            console.log('print using websocket '+url);
            var app_headers = new Headers();
            app_headers.append("Access-Control-Allow-Origin", "*");
            app_headers.append("Content-Type", "application/json");
            var requestOptions = {
                method: 'POST',
                headers: app_headers,
                mode: 'no-cors',
                body: receipt_data,
                redirect: 'follow'
            };
            fetch(url, requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error));
        },
        print_websocket_kot: function (widget, receipt, printer) {
            var self = this;
            console.log('print using web socket');
            console.log(widget);
            var receipt_data = JSON.stringify({
                "printer_ip": printer.printer_ip,
                "printer_port": printer.printer_port,
                "xmlreceipt": receipt,
                "origin": window.location.origin,
            });
            var client_app_ip = widget.pos.config.client_app_ip;
            var client_app_port = widget.pos.config.client_app_port;
            var url = "http://"+client_app_ip+":"+client_app_port;
            var app_headers = new Headers();
            app_headers.append("Access-Control-Allow-Origin", "*");
            app_headers.append("Content-Type", "application/json");

            var requestOptions = {
                method: 'POST',
                headers: app_headers,
                mode: 'no-cors',
                body: receipt_data,
                redirect: 'follow'
            };

            fetch(url, requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error));
        },
        remove_printed_order_kot: function (widget, uid) {
            var receipt_db = widget.pos.db.load('receipt', []);
            var printed_receipt = receipt_db.pop();
            if (printed_receipt.uid != uid) {
                receipt.push(printed_receipt);
            }
            widget.pos.db.save('receipt', receipt_db);
        },
        get_connector_token_kot: function (widget, printer) {
            var connector = _.filter(widget.pos.printer_connectors, function (line) {
                return line.id == printer.connector_id[0]
            });
            return connector[0].token;
        },

    });

    Registries.Component.add(Printer);

    return Printer;
});
