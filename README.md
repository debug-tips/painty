painty [![npm version](https://badge.fury.io/js/painty.svg)](http://badge.fury.io/js/painty)
----

 A First Meaningful Paint metric collector based on MutationObserver with a setTimeout fallback

## Usage

```
npm i -S painty
```

```js
import painty from 'painty';

painty(fmp => console.log(fmp));
```

optionally you can specify a timeout or by default painty will try to detect FMP until page unload

```js
painty(5000, fmp => console.log(fmp));
```
