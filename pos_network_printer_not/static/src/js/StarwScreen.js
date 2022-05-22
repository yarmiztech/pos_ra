odoo.define('pos_network_printer_not.StrawScreen', function (require) {
    'use strict';

    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');

    const StrawScreen = (ReceiptScreen) => {
        class StrawScreen extends ReceiptScreen {
            confirm() {
                this.props.resolve({ confirmed: true, payload: null });
                this.trigger('close-temp-screen');
            }
            whenClosing() {
                this.confirm();
            }
            /**
             * @override
             */
            async printReceipt() {
                await super.printReceipt();
                this.currentOrder._printed = false;
            }
        }
        StrawScreen.template = 'StrawScreen';
        return StrawScreen;
    };

    Registries.Component.addByExtending(StrawScreen, ReceiptScreen);

    return StrawScreen;
});
