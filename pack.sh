#!/bin/sh
zip -r ../zkui_packing/zkui.nw *
cd ../zkui_packing
cat /usr/bin/nw0.8.6 zkui.nw > zkui
chmod 755 zkui