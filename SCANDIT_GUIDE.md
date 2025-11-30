# Guide d'utilisation Scandit

## Configuration

### 1. Installation
Les packages Scandit sont déjà installés :
```bash
npm install --save @scandit/web-datacapture-core @scandit/web-datacapture-barcode
```

### 2. Clé de licence
Pour utiliser Scandit, vous devez avoir une clé de licence API. 

**Comment obtenir une clé :**
- Visitez https://www.scandit.com
- Créez un compte ou connectez-vous
- Obtenez une clé de test ou une clé de production

**Configuration de la clé :**
1. Ouvrez la page Scandit dans l'application
2. Entrez votre clé de licence dans le champ prévu
3. Cliquez sur "Activate License"
4. La clé sera sauvegardée dans le localStorage pour les sessions futures

## Fonctionnalités

### Mode Offline
✅ **Scandit fonctionne en mode offline** après le premier chargement de la bibliothèque.

La configuration utilise le CDN jsdelivr pour charger les fichiers WebAssembly :
```javascript
libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/build/engine/"
```

Pour un fonctionnement 100% offline, vous pouvez :
1. Copier les fichiers WASM dans votre dossier `public/`
2. Modifier le `libraryLocation` pour pointer vers votre dossier local

### Paramètres configurables

#### Résolution de la caméra
- SD (480p) - minimum
- HD (720p) - recommandé
- Full HD (1080p) - haute qualité
- 4K UHD - maximum (si supporté)

#### Types de codes-barres supportés
- CODE_128 (activé par défaut)
- QR Code
- EAN13
- EAN8
- CODE39
- CODE93
- DataMatrix

Vous pouvez activer plusieurs types simultanément via les checkboxes.

#### Zone de scan
- **Width (largeur)** : 30% à 100% de l'écran
- **Height (hauteur)** : 10% à 50% de l'écran

Plus la zone est petite, plus la détection est rapide et précise.

## Architecture technique

### Structure du code
```
ScanditPage.jsx
├── State Management
│   ├── License key
│   ├── Scanner state
│   ├── Settings (resolution, symbologies, scan area)
│   └── Logs
├── Scandit SDK Components
│   ├── DataCaptureContext (core)
│   ├── Camera (frame source)
│   ├── BarcodeCapture (detection)
│   └── DataCaptureView (UI overlay)
└── Lifecycle Management
    ├── Initialize license
    ├── Start/stop scanner
    └── Cleanup on unmount
```

### Workflow de scan
1. Validation de la licence
2. Création du DataCaptureContext
3. Configuration de la caméra avec les paramètres choisis
4. Configuration des symbologies de codes-barres
5. Définition de la zone de scan (locationSelection)
6. Ajout du listener pour les résultats
7. Création et attachement de la vue avec overlay
8. Démarrage de la caméra

### Gestion des résultats
Lorsqu'un code-barre est détecté :
1. Le résultat est affiché immédiatement
2. Une vibration confirme la détection (si supportée)
3. Le scanner se met en pause pendant 1 seconde
4. Le scan reprend automatiquement

## Avantages de Scandit

✅ **Performance** : Optimisé pour une détection ultra-rapide
✅ **Précision** : Taux de reconnaissance supérieur aux autres librairies
✅ **Multi-codes** : Peut scanner plusieurs codes-barres simultanément
✅ **Offline** : Fonctionne sans connexion internet
✅ **Configuration avancée** : Contrôle fin de tous les paramètres
✅ **Support professionnel** : Documentation et support de qualité

## Licence

⚠️ **Attention** : Scandit est une solution commerciale. 
- Une licence de test est gratuite mais limitée dans le temps
- Une licence de production est payante
- Les fonctionnalités peuvent varier selon le type de licence

## Comparaison avec les autres scanners

| Fonctionnalité | Scandit | html5-qrcode | Quagga | ZXing | ZBar |
|---------------|---------|--------------|--------|-------|------|
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Offline | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gratuit | ❌ | ✅ | ✅ | ✅ | ✅ |
| Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## Dépannage

### "License error"
- Vérifiez que votre clé est valide
- Vérifiez qu'elle n'a pas expiré
- Vérifiez que vous êtes sur un domaine autorisé

### Le scanner ne démarre pas
- Vérifiez les logs dans l'interface
- Assurez-vous que la caméra est accessible
- Vérifiez les permissions dans le navigateur

### Performances faibles
- Réduisez la zone de scan
- Baissez la résolution
- Désactivez les symbologies non utilisées

## Documentation officielle
https://docs.scandit.com/data-capture-sdk/web/
