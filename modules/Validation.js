const fs = require('fs');
const { diff, addedDiff, deletedDiff, detailedDiff, updatedDiff } = require("deep-object-diff");
const getJsonFile = require('./utils/getJsonFile')

const objectDataFromPath = require('./utils/objectDataFromPath');
function Validation(validationRules) {
    let _validationRules = validationRules;
    let _status;
    let me = this;
    let _baseData = _validationRules.baseData;
    if (typeof _baseData == "string") {
        _status = 'File Not Found: ' + _baseData;
        _baseData = getJsonFile(_baseData);
        if (_baseData != null) {
            _status = 'OK';
        }
    }

    function getTemplate(path) {
        for (var l in _validationRules.lists) {
            var listPath = _validationRules.lists[l];
            if (path.indexOf(listPath) >= 0) {
                var base = objectDataFromPath(_baseData, listPath);
                var rest = path.replace(listPath + '.', '').split('.');
                rest.shift();
                rest = rest.join('.');

                base = objectDataFromPath(base[Object.keys(base)[0]], rest);
                if (Array.isArray(base)) {
                    return base.shift();
                }
                return base;
            }
        }
        return objectDataFromPath(_baseData, path);
    }

    this.getStatus = () => {
        return _status;
    }

    function markMissingProperty(obj) {
        for (var p in obj) {
            if (obj[p] == undefined) {
                obj[p] = 'missing';
                continue;
            }
            if (typeof obj[p] == 'object') {
                obj[p] = markMissingProperty(obj[p]);
            }
        }
        return obj;
    }

    function validateAll(path, value) {
        var temp = Object.assign({}, _baseData);

        var ignore = _validationRules.lists.concat(_validationRules.optionalArrays);

        for (var l in ignore) {
            //tira o q for lista da validacao
            var delData = ignore[l].split('.');
            var pp = "delete temp";
            for (var i = 0; i < delData.length; i++) {
                pp += "['" + delData[i] + "']";
            }
            eval(pp);
        }
        //delete temp['simulation']['Room'];
        var diff = checkData(temp, value);

        if (Object.keys(diff).length == 0) {
            return { success: true, message: 'All data on server seems to be OK' };
        }
        diff = markMissingProperty(diff);
        return diff;


    }

    function checkData(template, value, basePath = '') {
        // to be able to insert direct array souch as "simulation.Ocean.Wave"
        if (Array.isArray(template)) {
            template  = template.shift();
        }

        var optArray = _validationRules.optionalListArrays;

        //@todo verificar se há necessidade de verificar o path completo dos opcionais para performance

        //validar Arrays opcionais quando vierem
        if (value != null) {
            for (var l in optArray) {
                var hasProperty = false;
                var delData = optArray[l].split('.');
                var removeFromTemplateIfNull = "";
                var optArrayData = value;
                for (var i = 0; i < delData.length; i++) {
                    //se nao tem nada dos opcionais pula fora

                    var pp = delData[i]
                    if (!optArrayData.hasOwnProperty(pp)) {
                        // não tem o optativo vamos tirar do template
                        continue;
                    }
                    hasProperty = true;
                    removeFromTemplateIfNull += "[\"" + pp + "\"]";
                    optArrayData = optArrayData[pp];
                }
                //valida o array de opcionais
                if (Array.isArray(optArrayData) && hasProperty ) {
                    var arrIndexRemplate = getTemplate(basePath + '.' + optArray[l]);
                    for (var data in optArrayData) {
                        diff = checkData(arrIndexRemplate, optArrayData[data]);
                        if (Object.keys(diff).length !== 0) {
                            var rrr = {};
                            rrr[optArray[l] + "[" + data + "]"] = diff;
                            return rrr;
                        }
                    }
                } else if (removeFromTemplateIfNull.length > 0) {
                    eval("delete template" + removeFromTemplateIfNull);
                }
            }
        }

        //validate direct array insert : Viewer3d.Config.Computers.computer_999.Screens
        var diff = {};
        if( Array.isArray(value) ){
            for(var i in value){
                var locdiff = checkData(template, value[i]);
                if (Object.keys(locdiff).length !== 0) {
                    diff[  i ] = diff;
                }
            }
        }else{
            diff = deletedDiff(template, value);
        }

        if (Object.keys(diff).length == 0) {
            //Valia possiveis arrays
            for (var p in template) {
                if (Array.isArray(template[p])) {
                    for (var i in value[p]) {
                        var val = value[p][i];
                        //valida item do array de acordo com o 0 template
                        diff = checkData(template[p][0], val, basePath);
                        if (Object.keys(diff).length !== 0) {
                            rrr = {};
                            rrr[p + "[" + i + "]"] = diff;
                            return rrr;
                        }
                    }
                }
            }
        }

        return diff;

    }

    function prettifyValidateResult(path, diff) {
        if (Object.keys(diff).length == 0) {
            return { success: true };
        }
        diff = markMissingProperty(diff);
        return { success: false, message: "Missing Property inside", path, diff };
    }

    this.validate = (path, value) => {

        if (_validationRules == null || _baseData == null || typeof _baseData != 'object') {
            return { success: true, message: 'No validation data was found' };
        }

        if (path.length == 0) {
            return prettifyValidateResult(path, validateAll(path, value));
        }

        var template = getTemplate(path)
        var templateType = typeof template;
        var valueType = typeof value;
        if (
            (typeof template == 'object' && typeof template != typeof value)
            ||
            (Array.isArray(template) && !Array.isArray(value))
        ) {

            return { success: false, message: `Invalid value type for '${path}' was given. ` };
        }

        var diff = checkData(template, value, path);

        return prettifyValidateResult(path, diff);


    }

}

module.exports = Validation;