;(function (window, document, Origo) {
  // PrintLogoSwitcher: växla logotyp i print-komponenten
  function PrintLogoSwitcher(options = {}, viewer) {
    // 1) Validera logos inparametern och ge robust fallback
    const logos = Array.isArray(options.logos) && options.logos.length > 0
      ? options.logos
      : [{ name: 'Standardlogga', png: 'img/print-logos/logo_print.png' }];

    // intern state per komponentinstans
    let currentIndex = 0;
    let logoButton = null;
    let insertedNode = null;    // sparar verklig DOM-node (wrapper eller knapp)
    let printCompOrigRender = null;

    return Origo.ui.Component({
      name: 'print-logo-switcher',

      onInit() {
        // Skapa Origo-knapp. title: '' förhindrar inre text ("undefined")
        logoButton = Origo.ui.Button({
          cls: 'o-barebone padding-small icon-smaller round light box-shadow o-print-logo-btn',
          click: () => {
            // komponent-API fallback (vi binder DOM-listener för real world)
            currentIndex = (currentIndex + 1) % logos.length;
            applyCurrentLogoToPrint();
            updateInsertedButtonVisual();
          },
          icon: null,
          title: '',
          tooltipText: logos[currentIndex].name,
          tooltipPlacement: 'east'
        });
      },

      onAdd(evt) {
        const viewerLocal = evt.target;
        const printControl = viewerLocal.getControlByName('print');
        if (!printControl) return;
        const printComp = printControl.getPrintComponent();
        if (!printComp) return;

        // Spara originalrender för att kunna override:a
        printCompOrigRender = printComp.render;
        const self = this;

        printComp.render = function (...args) {
          const result = printCompOrigRender.apply(this, args);

          // Hitta container där controls finns
          const container = document.querySelector('.o-print-tools-left') || document.querySelector('#o-print-tools-left');
          if (!container) return result;

          // Om knappen saknas, skapa och infoga
          if (!container.querySelector('.o-print-logo-btn')) {
            self.addComponents([logoButton]);

            const htmlString = logoButton.render();
            // Origo.ui.dom.html kan returnera ett DocumentFragment; appendChild hanterar fragment korrekt
            const fragment = Origo.ui.dom.html(htmlString);
            container.appendChild(fragment);

            // 3) Efter append: hämta verklig knapp-nod från dokumentet (inte fragment)
            const foundBtn = container.querySelector('.o-print-logo-btn') || container.querySelector('button.o-barebone') || container.querySelector('button');
            insertedNode = foundBtn ? (foundBtn.closest('span') || foundBtn) : (container.querySelector('span[data-tooltip]') || container.firstElementChild);

            // Debug-logg (kan tas bort i produktion)
            console.debug('PrintLogoSwitcher: knapp insatt, insertedNode =', insertedNode);

            // Hämta knapp-elementet och bind listeners
            const btnEl = insertedNode && (insertedNode.querySelector('.o-print-logo-btn') || insertedNode.querySelector('button') || insertedNode);
            attachBtnListener(btnEl);
            updateInsertedButtonVisual();
          } else {
            // Om redan infogad: säkerställ referens och binder listener
            if (!insertedNode) {
              const possible = container.querySelector('.o-print-logo-btn') || container.querySelector('button.o-barebone');
              insertedNode = possible ? (possible.closest('span') || possible) : (container.querySelector('span[data-tooltip]') || container.firstElementChild);
              console.debug('PrintLogoSwitcher: återhämtade insertedNode från DOM', insertedNode);
            }
            const btnEl = insertedNode && (insertedNode.querySelector('.o-print-logo-btn') || insertedNode.querySelector('button') || insertedNode);
            attachBtnListener(btnEl);
            updateInsertedButtonVisual();
          }

          // Applicera aktuell logga i print-vyn varje render
          applyCurrentLogoToPrint();

          return result;
        };
      },

      render() {
        // component håller sig i DOM via injection, inget HTML att returnera
        return '';
      }
    });

    // Binds click + keyboard (Enter/Space) och hanterar deduplisering av handlers
    function attachBtnListener(btnEl) {
      if (!btnEl || btnEl.nodeType !== 1) return;

      // Ta bort tidigare handler om existerande för att undvika dubbla
      if (btnEl.__plsClickHandler) {
        btnEl.removeEventListener('click', btnEl.__plsClickHandler);
        if (btnEl.__plsKeyHandler) btnEl.removeEventListener('keydown', btnEl.__plsKeyHandler);
        delete btnEl.__plsClickHandler;
        delete btnEl.__plsKeyHandler;
      }

      // Click handler
      const clickHandler = (evt) => {
        // Stoppa bubbla så Origo inte får oförutsett event
        evt.stopPropagation();
        evt.preventDefault();
        currentIndex = (currentIndex + 1) % logos.length;
        applyCurrentLogoToPrint();
        updateInsertedButtonVisual();
      };

      // Keyboard handler för Enter och Space (tangentbordsåtkomst)
      const keyHandler = (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          // återanvänd click-logik
          clickHandler(evt);
        }
      };

      btnEl.__plsClickHandler = clickHandler;
      btnEl.__plsKeyHandler = keyHandler;
      btnEl.addEventListener('click', clickHandler);
      btnEl.addEventListener('keydown', keyHandler);

      // Tillgänglighet: tabbbar, aria-pressed
      if (!btnEl.hasAttribute('tabindex')) btnEl.setAttribute('tabindex', '0');
      btnEl.setAttribute('role', 'button');
      btnEl.setAttribute('aria-pressed', 'false');
    }

    // Applicera aktuell logga i print-komponentens bild-element
    function applyCurrentLogoToPrint() {
      const apply = () => {
        const printImg = document.querySelector('.padding-bottom-small');
        if (!printImg) return setTimeout(apply, 50);
        const desired = logos[currentIndex].png;
        if (!printImg.src || printImg.src.indexOf(desired) === -1) {
          printImg.src = desired;
          console.debug('PrintLogoSwitcher: print-img satt till', desired);
        }
      };
      apply();
    }

    // Uppdaterar knappens visuella utseende + tooltip + aria
    function updateInsertedButtonVisual() {
      // Om insertedNode saknas: försök hämta från DOM (fallback)
      if (!insertedNode) {
        const container = document.querySelector('.o-print-tools-left') || document.querySelector('#o-print-tools-left');
        const possible = container ? (container.querySelector('.o-print-logo-btn') || container.querySelector('button.o-barebone') || container.querySelector('span[data-tooltip]')) : null;
        insertedNode = possible ? (possible.closest('span') || possible) : null;
      }

      if (!insertedNode) {
        console.warn('PrintLogoSwitcher: update aborted, no insertedNode found');
        return;
      }

      // Hitta wrapper och knapp
      const wrapper = insertedNode.closest ? (insertedNode.closest('span') || insertedNode) : insertedNode;
      let btnEl = (wrapper && wrapper.querySelector && (wrapper.querySelector('.o-print-logo-btn') || wrapper.querySelector('button'))) || document.querySelector('.o-print-logo-btn') || wrapper;
      if (!btnEl || btnEl.nodeType !== 1) {
        console.warn('PrintLogoSwitcher: kunde ej hitta btnEl för update');
        return;
      }

      // Rensa eventuell visning av inre text-span (förebygger "undefined")
      const firstSpan = btnEl.querySelector('span');
      if (firstSpan && firstSpan.textContent) firstSpan.textContent = '';

      // Uppdatera ikon: om Origo ger en inre <img> använd den, annars sätt background-image
      const innerImg = btnEl.querySelector('img');
      if (innerImg) {
        innerImg.src = logos[currentIndex].png;
        innerImg.alt = logos[currentIndex].name;
        innerImg.style.display = '';
      } else {
        const innerSvg = btnEl.querySelector('svg');
        if (innerSvg) innerSvg.style.display = 'none';
        if (btnEl.style) {
          btnEl.style.backgroundImage = `url(${logos[currentIndex].png})`;
          btnEl.style.backgroundRepeat = 'no-repeat';
          btnEl.style.backgroundPosition = 'center';
          btnEl.style.backgroundSize = '60%';
        }
      }

      // Ny tooltip-text och aria
      const newTooltip = logos[currentIndex].name;

      // Uppdatera alla relevanta element med data-tooltip (wrapper + btnEl + inre)
      const elems = [];
      try {
        if (wrapper && wrapper.querySelectorAll) {
          wrapper.querySelectorAll('[data-tooltip]').forEach(n => elems.push(n));
        }
      } catch (e) { /* ignore */ }
      if (!elems.includes(btnEl)) elems.push(btnEl);
      if (!elems.includes(wrapper)) elems.push(wrapper);

      elems.forEach(el => {
        try {
          el.setAttribute('data-tooltip', newTooltip);
          el.setAttribute('data-placement', 'east');
        } catch (e) { /* ignore */ }
      });

      // Tillgänglighet: aria-label + aria-pressed toggling för visuell state
      try { btnEl.setAttribute('aria-label', newTooltip); } catch (e) { /* ignore */ }
      try { btnEl.setAttribute('aria-pressed', 'false'); } catch (e) { /* ignore */ }

      // Försök använda komponent-API om tillgängligt
      let apiUpdated = false;
      try {
        if (logoButton && typeof logoButton.setTooltipText === 'function') {
          logoButton.setTooltipText(newTooltip);
          apiUpdated = true;
        }
      } catch (e) { apiUpdated = false; }

      // Om API inte fanns/inte fungerade, tvinga tooltip-logiken att läsa nya attribut:
      // gör en snabb class-toggle via requestAnimationFrame för bättre timing än setTimeout
      if (!apiUpdated) {
        elems.forEach(el => el.classList.remove('o-tooltip'));
        // next paint
        window.requestAnimationFrame(() => {
          elems.forEach(el => el.classList.add('o-tooltip'));
        });
      }

      // Kort visuell feedback: toggla aria-pressed true -> false (för skärmläsare/assistans)
      try {
        btnEl.setAttribute('aria-pressed', 'true');
        setTimeout(() => btnEl.setAttribute('aria-pressed', 'false'), 180);
      } catch (e) { /* ignore */ }

      console.debug('PrintLogoSwitcher: tooltip satt på elements:', elems, 'value:', newTooltip);
      console.debug('PrintLogoSwitcher: knapp uppdaterad med', newTooltip, logos[currentIndex].png);
    }
  }

  // Exportera plugin
  window.PrintLogoSwitcher = PrintLogoSwitcher;
})(window, document, window.Origo);
