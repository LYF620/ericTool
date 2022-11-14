'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.LOG_VERDACCIO_ERROR =
  exports.LOG_VERDACCIO_BYTES =
  exports.LOG_STATUS_MESSAGE =
    void 0;
exports.allow = allow;
exports.antiLoop = antiLoop;
exports.encodeScopePackage = encodeScopePackage;
exports.errorReportingMiddleware = errorReportingMiddleware;
exports.expectJson = expectJson;
exports.final = final;
exports.handleError = handleError;
exports.log = log;
exports.match = match;
exports.media = media;
exports.setSecurityWebHeaders = setSecurityWebHeaders;
exports.validateName = validateName;
exports.validatePackage = validatePackage;

var _debug = _interopRequireDefault(require('debug'));

var _lodash = _interopRequireDefault(require('lodash'));

var _core = require('@verdaccio/core');

var _logger = require('@verdaccio/logger');

var _utils = require('@verdaccio/utils');

var _middlewareUtils = require('./middleware-utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const debug = (0, _debug.default)('verdaccio:middleware');

function match(regexp) {
  return function (req, res, next, value) {
    if (regexp.exec(value)) {
      next();
    } else {
      next('route');
    }
  };
} // TODO: remove, was relocated to web package
// @ts-deprecated

function setSecurityWebHeaders(req, res, next) {
  // disable loading in frames (clickjacking, etc.)
  res.header(_core.HEADERS.FRAMES_OPTIONS, 'deny'); // avoid stablish connections outside of domain

  // by_Eric
  res.header(_core.HEADERS.CSP, "connect-src 'http://192.168.5.41/'");
  // https://stackoverflow.com/questions/18337630/what-is-x-content-type-options-nosniff

  res.header(_core.HEADERS.CTO, 'nosniff'); // https://stackoverflow.com/questions/9090577/what-is-the-http-header-x-xss-protection

  res.header(_core.HEADERS.XSS, '1; mode=block');
  next();
}

function validateName(req, res, next, value, name) {
  if (value === '-') {
    // special case in couchdb usually
    next('route');
  } else if ((0, _utils.validateName)(value)) {
    next();
  } else {
    next(_core.errorUtils.getForbidden('invalid ' + name));
  }
}

function validatePackage(req, res, next, value, name) {
  if (value === '-') {
    // special case in couchdb usually
    next('route');
  } else if ((0, _utils.validatePackage)(value)) {
    next();
  } else {
    next(_core.errorUtils.getForbidden('invalid ' + name));
  }
}

function media(expect) {
  return function (req, res, next) {
    if (req.headers[_core.HEADER_TYPE.CONTENT_TYPE] !== expect) {
      next(
        _core.errorUtils.getCode(
          _core.HTTP_STATUS.UNSUPPORTED_MEDIA,
          'wrong content-type, expect: ' +
            expect +
            ', got: ' +
            req.get[_core.HEADER_TYPE.CONTENT_TYPE]
        )
      );
    } else {
      next();
    }
  };
}

function encodeScopePackage(req, res, next) {
  if (req.url.indexOf('@') !== -1) {
    // e.g.: /@org/pkg/1.2.3 -> /@org%2Fpkg/1.2.3, /@org%2Fpkg/1.2.3 -> /@org%2Fpkg/1.2.3
    req.url = req.url.replace(/^(\/@[^\/%]+)\/(?!$)/, '$1%2F');
  }

  next();
}

function expectJson(req, res, next) {
  if (!(0, _utils.isObject)(req.body)) {
    return next(_core.errorUtils.getBadRequest("can't parse incoming json"));
  }

  next();
}

function antiLoop(config) {
  return function (req, res, next) {
    var _req$headers;

    if (
      (req === null || req === void 0
        ? void 0
        : (_req$headers = req.headers) === null || _req$headers === void 0
        ? void 0
        : _req$headers.via) != null
    ) {
      const arr = req.headers.via.split(',');

      for (let i = 0; i < arr.length; i++) {
        const m = arr[i].match(/\s*(\S+)\s+(\S+)/);

        if (m && m[2] === config.server_id) {
          return next(
            _core.errorUtils.getCode(
              _core.HTTP_STATUS.LOOP_DETECTED,
              'loop detected'
            )
          );
        }
      }
    }

    next();
  };
}

function allow(auth) {
  return function (action) {
    return function (req, res, next) {
      req.pause();
      const packageName = req.params.scope
        ? `@${req.params.scope}/${req.params.package}`
        : req.params.package;
      const packageVersion = req.params.filename
        ? (0, _middlewareUtils.getVersionFromTarball)(req.params.filename)
        : undefined;
      const remote = req.remote_user;

      _logger.logger.trace(
        {
          action,
          user: remote === null || remote === void 0 ? void 0 : remote.name,
        },
        `[middleware/allow
            ][@{action
                }
            ] allow for @{user
            }`
      );

      auth['allow_' + action](
        {
          packageName,
          packageVersion,
        },
        remote,
        function (error, allowed) {
          req.resume();

          if (error) {
            next(error);
          } else if (allowed) {
            next();
          } else {
            // last plugin (that's our built-in one) returns either
            // cb(err) or cb(null, true), so this should never happen
            throw _core.errorUtils.getInternalError(
              _core.API_ERROR.PLUGIN_ERROR
            );
          }
        }
      );
    };
  };
}

function final(
  body,
  req,
  res, // if we remove `next` breaks test
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next
) {
  if (
    res.statusCode === _core.HTTP_STATUS.UNAUTHORIZED &&
    !res.getHeader(_core.HEADERS.WWW_AUTH)
  ) {
    // they say it's required for 401, so...
    res.header(
      _core.HEADERS.WWW_AUTH,
      `${_core.TOKEN_BASIC}, ${_core.TOKEN_BEARER}`
    );
  }

  try {
    if (_lodash.default.isString(body) || _lodash.default.isObject(body)) {
      if (!res.getHeader(_core.HEADERS.CONTENT_TYPE)) {
        res.header(_core.HEADERS.CONTENT_TYPE, _core.HEADERS.JSON);
      }

      if (typeof body === 'object' && _lodash.default.isNil(body) === false) {
        if (typeof body.error === 'string') {
          res.locals._verdaccio_error = body.error; // res._verdaccio_error = (body as MiddlewareError).error;
        }

        body = JSON.stringify(body, undefined, '  ') + '\n';
      } // don't send etags with errors

      if (
        !res.statusCode ||
        (res.statusCode >= _core.HTTP_STATUS.OK &&
          res.statusCode < _core.HTTP_STATUS.MULTIPLE_CHOICES)
      ) {
        res.header(
          _core.HEADERS.ETAG,
          '"' + (0, _utils.stringToMD5)(body) + '"'
        );
      }
    } else {
      // send(null), send(204), etc.
    }
  } catch (err) {
    // if verdaccio sends headers first, and then calls res.send()
    // as an error handler, we can't report error properly,
    // and should just close socket
    if (err.message.match(/set headers after they are sent/)) {
      if (_lodash.default.isNil(res.socket) === false) {
        var _res$socket;

        (_res$socket = res.socket) === null || _res$socket === void 0
          ? void 0
          : _res$socket.destroy();
      }

      return;
    }

    throw err;
  }
  res.send(body);
} // FIXME: deprecated, moved to @verdaccio/dev-commons

const LOG_STATUS_MESSAGE =
  "@{status}, user: @{user}(@{remoteIP}), req: '@{request.method} @{request.url}'";
exports.LOG_STATUS_MESSAGE = LOG_STATUS_MESSAGE;
const LOG_VERDACCIO_ERROR = `${LOG_STATUS_MESSAGE}, error: @{!error
}`;
exports.LOG_VERDACCIO_ERROR = LOG_VERDACCIO_ERROR;
const LOG_VERDACCIO_BYTES = `${LOG_STATUS_MESSAGE}, bytes: @{bytes.in
}/@{bytes.out
}`;
exports.LOG_VERDACCIO_BYTES = LOG_VERDACCIO_BYTES;

function log(req, res, next) {
  // logger
  req.log = _logger.logger.child({
    sub: 'in',
  });
  const _auth = req.headers.authorization;

  if (_lodash.default.isNil(_auth) === false) {
    req.headers.authorization = '<Classified>';
  }

  const _cookie = req.get('cookie');

  if (_lodash.default.isNil(_cookie) === false) {
    req.headers.cookie = '<Classified>';
  }

  req.url = req.originalUrl;
  req.log.info(
    {
      req: req,
      ip: req.ip,
    },
    "@{ip} requested '@{req.method} @{req.url}'"
  );
  req.originalUrl = req.url;

  if (_lodash.default.isNil(_auth) === false) {
    req.headers.authorization = _auth;
  }

  if (_lodash.default.isNil(_cookie) === false) {
    req.headers.cookie = _cookie;
  }

  let bytesin = 0;
  req.on('data', function (chunk) {
    bytesin += chunk.length;
  });
  let bytesout = 0;
  const _write = res.write; // FIXME: res.write should return boolean
  // @ts-ignore

  res.write = function (buf) {
    bytesout += buf.length;
    /* eslint prefer-rest-params: "off" */
    // @ts-ignore

    _write.apply(res, arguments);
  };

  const log = function () {
    const forwardedFor = req.get('x-forwarded-for');
    const remoteAddress = req.connection.remoteAddress;
    const remoteIP = forwardedFor
      ? `${forwardedFor} via ${remoteAddress}`
      : remoteAddress;
    let message;

    if (res.locals._verdaccio_error) {
      message = LOG_VERDACCIO_ERROR;
    } else {
      message = LOG_VERDACCIO_BYTES;
    }

    req.url = req.originalUrl;
    req.log.http(
      {
        request: {
          method: req.method,
          url: req.url,
        },
        user: (req.remote_user && req.remote_user.name) || null,
        remoteIP,
        status: res.statusCode,
        error: res.locals._verdaccio_error,
        bytes: {
          in: bytesin,
          out: bytesout,
        },
      },
      message
    );
    req.originalUrl = req.url;
  };
  req.on('close', function () {
    log();
  });
  const _end = res.end; // @ts-ignore

  res.end = function (buf) {
    if (buf) {
      bytesout += buf.length;
    }
    /* eslint prefer-rest-params: "off" */
    // @ts-ignore

    _end.apply(res, arguments);

    log();
  };

  next();
}

function handleError(err, req, res, next) {
  debug('error handler init');

  if (_lodash.default.isError(err)) {
    debug('is native error');

    if (
      err.code === 'ECONNABORT' &&
      res.statusCode === _core.HTTP_STATUS.NOT_MODIFIED
    ) {
      return next();
    }

    if (_lodash.default.isFunction(res.locals.report_error) === false) {
      debug('is locals error report ref'); // in case of very early error this middleware may not be loaded before error is generated
      // fixing that

      errorReportingMiddleware(req, res, _lodash.default.noop);
    }

    debug('set locals error report ref');
    res.locals.report_error(err);
  } else {
    // Fall to Middleware.final
    debug('no error to report, jump next layer');
    return next(err);
  }
} // Middleware

function errorReportingMiddleware(req, res, next) {
  debug('error report middleware');

  res.locals.report_error =
    res.locals.report_error ||
    function (err) {
      if (
        err.status &&
        err.status >= _core.HTTP_STATUS.BAD_REQUEST &&
        err.status < 600
      ) {
        debug(
          'is error > 409 %o',
          err === null || err === void 0 ? void 0 : err.status
        );

        if (_lodash.default.isNil(res.headersSent) === false) {
          debug(
            'send status %o',
            err === null || err === void 0 ? void 0 : err.status
          );
          res.status(err.status);
          debug(
            'next layer %o',
            err === null || err === void 0 ? void 0 : err.message
          );
          next({
            error: err.message || _core.API_ERROR.UNKNOWN_ERROR,
          });
        }
      } else {
        debug(
          'is error < 409 %o',
          err === null || err === void 0 ? void 0 : err.status
        );

        _logger.logger.error(
          {
            err: err,
          },
          'unexpected error: @{!err.message}\n@{err.stack}'
        );

        if (!res.status || !res.send) {
          // TODO: decide which debug keep
          _logger.logger.error(
            'this is an error in express.js, please report this'
          );

          debug(
            'this is an error in express.js, please report this, destroy response %o',
            err
          );
          res.destroy();
        } else if (!res.headersSent) {
          debug('report internal error %o', err);
          res.status(_core.HTTP_STATUS.INTERNAL_ERROR);
          next({
            error: _core.API_ERROR.INTERNAL_SERVER_ERROR,
          });
        } else {
          // socket should be already closed
          debug('this should not happen, otherwise report %o', err);
        }
      }
    };

  debug('error report middleware next()');
  next();
}
