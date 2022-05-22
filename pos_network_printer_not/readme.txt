var esc = '\x1B'; //ESC byte in hex notation
            var newLine = '\x0A'; //LF byte in hex notation

            var cmds = esc + "@"; //Initializes the printer (ESC @)
            cmds += esc + '!' + '\x38'; //Emphasized + Double-height + Double-width mode selected (ESC ! (8 + 16 + 32)) 56 dec => 38 hex
            cmds += 'BEST DEAL STORES'; //text to print
            cmds += newLine + newLine;
            cmds += esc + '!' + '\x00'; //Character font A selected (ESC ! 0)
            cmds += 'COOKIES                   5.00';
            cmds += newLine;
            cmds += 'MILK 65 Fl oz             3.78';
            cmds += newLine + newLine;
            cmds += 'SUBTOTAL                  8.78';
            cmds += newLine;
            cmds += 'TAX 5%                    0.44';
            cmds += newLine;
            cmds += 'TOTAL                     9.22';
            cmds += newLine;
            cmds += 'CASH TEND                10.00';
            cmds += newLine;
            cmds += 'CASH DUE                  0.78';
            cmds += newLine + newLine;
            cmds += esc + '!' + '\x18'; //Emphasized + Double-height mode selected (ESC ! (16 + 8)) 24 dec => 18 hex
            cmds += '# ITEMS SOLD 2';
            cmds += esc + '!' + '\x00'; //Character font A selected (ESC ! 0)
            cmds += newLine + newLine;
            cmds += '11/03/13  19:53:17';

            var escposCommands = doc
                .font(escpos.FontFamily.A)
                .align(escpos.TextAlignment.Center)
                .size(0, 0)
                .text(cmds);




 .escpos.setCharacterCodeTable(EscPos.CharacterCodeTable.WCP1256_Arabic);
