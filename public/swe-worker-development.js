/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/.pnpm/@serwist+next@9.0.9_next@15.0.2_@babel+core@7.26.0_babel-plugin-react-compiler@19.0.0-beta-6f_y3lcxelz2q67hfnkctripdg6nu/node_modules/@serwist/next/dist/sw-entry-worker.js":
/*!********************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@serwist+next@9.0.9_next@15.0.2_@babel+core@7.26.0_babel-plugin-react-compiler@19.0.0-beta-6f_y3lcxelz2q67hfnkctripdg6nu/node_modules/@serwist/next/dist/sw-entry-worker.js ***!
  \********************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\nself.onmessage = async (ev)=>{\n    switch(ev.data.type){\n        case \"__START_URL_CACHE__\":\n            {\n                const url = ev.data.url;\n                const response = await fetch(url);\n                if (!response.redirected) {\n                    const startUrlCache = await caches.open(\"start-url\");\n                    return startUrlCache.put(url, response);\n                }\n                return Promise.resolve();\n            }\n        case \"__FRONTEND_NAV_CACHE__\":\n            {\n                const url = ev.data.url;\n                const pagesCache = await caches.open(\"pages\");\n                const isPageCached = !!await pagesCache.match(url, {\n                    ignoreSearch: true\n                });\n                if (isPageCached) {\n                    return;\n                }\n                const page = await fetch(url);\n                if (!page.ok) {\n                    return;\n                }\n                pagesCache.put(url, page.clone());\n                return Promise.resolve();\n            }\n        default:\n            return Promise.resolve();\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvLnBucG0vQHNlcndpc3QrbmV4dEA5LjAuOV9uZXh0QDE1LjAuMl9AYmFiZWwrY29yZUA3LjI2LjBfYmFiZWwtcGx1Z2luLXJlYWN0LWNvbXBpbGVyQDE5LjAuMC1iZXRhLTZmX3kzbGN4ZWx6MnE2N2hmbmtjdHJpcGRnNm51L25vZGVfbW9kdWxlcy9Ac2Vyd2lzdC9uZXh0L2Rpc3Qvc3ctZW50cnktd29ya2VyLmpzIiwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy8ucG5wbS9Ac2Vyd2lzdCtuZXh0QDkuMC45X25leHRAMTUuMC4yX0BiYWJlbCtjb3JlQDcuMjYuMF9iYWJlbC1wbHVnaW4tcmVhY3QtY29tcGlsZXJAMTkuMC4wLWJldGEtNmZfeTNsY3hlbHoycTY3aGZua2N0cmlwZGc2bnUvbm9kZV9tb2R1bGVzL0BzZXJ3aXN0L25leHQvZGlzdC9zdy1lbnRyeS13b3JrZXIuanM/Y2Y0OSJdLCJzb3VyY2VzQ29udGVudCI6WyJzZWxmLm9ubWVzc2FnZSA9IGFzeW5jIChldik9PntcbiAgICBzd2l0Y2goZXYuZGF0YS50eXBlKXtcbiAgICAgICAgY2FzZSBcIl9fU1RBUlRfVVJMX0NBQ0hFX19cIjpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBldi5kYXRhLnVybDtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5yZWRpcmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0VXJsQ2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbihcInN0YXJ0LXVybFwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXJ0VXJsQ2FjaGUucHV0KHVybCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJfX0ZST05URU5EX05BVl9DQUNIRV9fXCI6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gZXYuZGF0YS51cmw7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFnZXNDYWNoZSA9IGF3YWl0IGNhY2hlcy5vcGVuKFwicGFnZXNcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNQYWdlQ2FjaGVkID0gISFhd2FpdCBwYWdlc0NhY2hlLm1hdGNoKHVybCwge1xuICAgICAgICAgICAgICAgICAgICBpZ25vcmVTZWFyY2g6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoaXNQYWdlQ2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYWdlLm9rKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFnZXNDYWNoZS5wdXQodXJsLCBwYWdlLmNsb25lKCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG59O1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./node_modules/.pnpm/@serwist+next@9.0.9_next@15.0.2_@babel+core@7.26.0_babel-plugin-react-compiler@19.0.0-beta-6f_y3lcxelz2q67hfnkctripdg6nu/node_modules/@serwist/next/dist/sw-entry-worker.js\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	(() => {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = () => {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: (script) => (script)
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	(() => {
/******/ 		__webpack_require__.ts = (script) => (__webpack_require__.tt().createScript(script));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	(() => {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push((options) => {
/******/ 			const originalFactory = options.factory;
/******/ 			options.factory = (moduleObject, moduleExports, webpackRequire) => {
/******/ 				const hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				const cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : () => {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./node_modules/.pnpm/@serwist+next@9.0.9_next@15.0.2_@babel+core@7.26.0_babel-plugin-react-compiler@19.0.0-beta-6f_y3lcxelz2q67hfnkctripdg6nu/node_modules/@serwist/next/dist/sw-entry-worker.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;