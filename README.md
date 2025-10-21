# Origo-print-logo-switcher
This is a simple plugin that allows you to change the print logo in your Origo map instance.

To use:

1. Git clone https://github.com/avalna/Origo-print-logo-switcher
2. Place the folder in your plugins folder or other appropriate location
3. Refer to the plugin and its file in your index.html
Example:
<link rel="stylesheet" href="src/plugins/print-logo-switcher/style.css">
<script src="src/plugins/print-logo-switcher/index.js"></script>

4. Place your choice of print logos in the print-logos folder and put the folder within the standard img folder that comes with your Origo Map instance
5. Init the plugin like this:

<script type="text/javascript">
  var origo = Origo('index.json');
  origo.on('load', function(viewer) {
    var pls = PrintLogoSwitcher({
      logos: [
        { name: 'Avesta logga',       png: 'img/print-logos/avesta_logga.png' },
        { name: 'Logo Avesta Vatten', png: 'img/print-logos/logo_avesta_va.png' },
        { name: 'Gamla Byn',          png: 'img/print-logos/gamla_byn_logo.png' },
        { name: 'Industristad',       png: 'img/print-logos/industristad_small.png' }
      ]
    }, viewer);
    viewer.addComponent(pls);
  });
</script>

description:
name: tooltip name for the desired logo
png: location for the logos

The plugin hava a fallback logo so it still runs if none of your own logos are specified:
var pls = PrintLogoSwitcher({}, viewer);
viewer.addComponent(pls);
