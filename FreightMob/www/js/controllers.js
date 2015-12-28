var appControllers = angular.module('MobileAPP.controllers', [
    'ionic',
	'ionMdInput',
    'ngCordova.plugins.toast',
    'ngCordova.plugins.dialogs',
    'ngCordova.plugins.appVersion',
    'ngCordova.plugins.file',
    'ngCordova.plugins.fileTransfer',
    'ngCordova.plugins.fileOpener2',
    'ngCordova.plugins.datePicker',
    'ngCordova.plugins.barcodeScanner',
    'MobileAPP.directives',
    'MobileAPP.services'
]);

appControllers.controller('LoadingCtrl',
        ['$state', '$timeout',
        function ($state, $timeout) {
            $timeout(function () {
                $state.go('login', { 'blnCheckUpdate': 'N' }, { reload: true });
            }, 2500);
        }]);

appControllers.controller('LoginCtrl',
        ['$scope', '$http', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaToast', '$cordovaAppVersion', 'WebApiService', 
        function ($scope, $http, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaToast, $cordovaAppVersion, WebApiService) {
            $scope.logininfo = {};
            $scope.logininfo.strUserName = "";
            $scope.logininfo.strPassword = "";
            $('#iUserName').on('keydown', function (e) {
                if (e.which === 9 || e.which === 13) {
                    $('#iPassword').focus();
                }
            });
            $('#iPassword').on('keydown', function (e) {
                if (e.which === 9 || e.which === 13) {
                    $scope.login();
                }
            });            
            $scope.GoToUpdate = function () {
                var url = strWebServiceURL + strBaseUrl + '/update.json';
                $http.get(url)
                .success(function (res) {
                        var serverAppVersion = res.version;
                        $cordovaAppVersion.getVersionNumber().then(function (version) {
                            if (version != serverAppVersion) {
                                $state.go('update', { 'Version': serverAppVersion });
                            } else {
                                var alertPopup = $ionicPopup.alert({
                                    title: "Already the Latest Version!",
                                    okType: 'button-assertive'
                                });
                                $timeout(function () {
                                    alertPopup.close();
                                }, 2500);
                            }
                        });
                    })
                .error(function (res) {
                        var alertPopup = $ionicPopup.alert({
                            title: "Connect Update Server Error!",
                            okType: 'button-assertive'
                        });
                        $timeout(function () {
                            alertPopup.close();
                        }, 2500);
                    });
            };
            $scope.GoToSetting = function () {
                $state.go('setting', {}, { reload: true });
            };
            $scope.login = function () {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.close();
                }
                if ($scope.logininfo.strUserName == "") {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Please Enter User Name.',
                        okType: 'button-assertive'
                    });
                    $timeout(function () {
                        alertPopup.close();
                    }, 2500);
                    return;
                }
                $ionicLoading.show();
                var jsonData = { "UserId": $scope.logininfo.strUserName, "Password": hex_md5($scope.logininfo.strPassword) };
                var strUri = "/api/freight/login";
                var onSuccess = function (response) {
                    $ionicLoading.hide();
                    sessionStorage.clear();
                    sessionStorage.setItem("UserId", $scope.logininfo.strUserName);
                    //Add JPush RegistradionID
                    if (blnMobilePlatform) {
                        window.plugins.jPushPlugin.getRegistrationID(onGetRegistradionID);
                    }
                    $state.go('main', {}, { reload: true });
                };
                var onError = function () {
                    $ionicLoading.hide();
                };
                WebApiService.Post(strUri, jsonData, onSuccess, onError);
            }; 
			if ($stateParams.blnCheckUpdate === 'Y') {
                var url = strWebSiteURL + '/update.json';
                $http.get(url)
                .success(function (res) {
                        var serverAppVersion = res.version;
                        $cordovaAppVersion.getVersionNumber().then(function (version) {
                            if (version != serverAppVersion) {
                                $state.go('update', { 'Version': serverAppVersion });
                            }
                        });
                    })
                .error(function (res) {});
            }
            $('#iUserName').focus();
        }]);

appControllers.controller('SettingCtrl',
        ['$scope', '$state', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaToast', '$cordovaFile',
        function ($scope, $state, $timeout, $ionicLoading, $ionicPopup, $cordovaToast, $cordovaFile) {
            $scope.Setting = {};
            $scope.Setting.WebServiceURL = strWebServiceURL.replace('http://', '');
            $scope.Setting.BaseUrl = strBaseUrl.replace('/', '');
            $scope.returnLogin = function () {
                $state.go('login', { 'CheckUpdate': 'Y' }, { reload: true });
            };
            $scope.saveSetting = function () {
                if ($scope.Setting.WebServiceURL.length > 0) {
                    strWebServiceURL = $scope.Setting.WebServiceURL;
                    if (strWebServiceURL.length > 0) {
                        strWebServiceURL = "http://" + strWebServiceURL;
                    }
                } else { $scope.Setting.WebServiceURL = strWebServiceURL }
                if ($scope.Setting.BaseUrl.length > 0) {
                    strBaseUrl = $scope.Setting.BaseUrl;
                    if (strBaseUrl.length > 0) {
                        strBaseUrl = "/" + strBaseUrl;
                    }
                } else { $scope.Setting.BaseUrl = strBaseUrl }
                if ($scope.Setting.WebSiteUrl.length > 0) {
                    strWebSiteURL = $scope.Setting.WebSiteUrl;
                    if (strWebSiteURL.length > 0) {
                        strWebSiteURL = "http://" + strWebSiteURL;
                    }
                } else { $scope.Setting.WebSiteUrl = strWebSiteURL }
                var data = 'BaseUrl=' + $scope.Setting.BaseUrl + '##WebServiceURL=' + $scope.Setting.WebServiceURL + '##WebSiteURL=' + strWebSiteURL;
                var path = cordova.file.externalRootDirectory;
                var file = strAppRootPath + "/" + strAppConfigFileName;
                $cordovaFile.writeFile(path, file, data, true)
                .then(function (success) {
                    $state.go('login', { 'CheckUpdate': 'Y' }, { reload: true });
                }, function (error) {
                    $cordovaToast.showShortBottom(error);
                });
            };
            $scope.delSetting = function () {
                var path = cordova.file.externalRootDirectory;
                var file = strAppRootPath + "/" + strAppConfigFileName;
                $cordovaFile.removeFile(path, file)
                .then(function (success) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Delete Config File Success.',
                        okType: 'button-calm'
                    });
                    $timeout(function () {
                        alertPopup.close();
                    }, 2500);
                }, function (error) {
                    $cordovaToast.showShortBottom(error);
                });
            };
        }]);

appControllers.controller('UpdateCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$cordovaToast', '$cordovaFile', '$cordovaFileTransfer', '$cordovaFileOpener2',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $cordovaToast, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2) {
            $scope.strVersion = $stateParams.Version;
            $scope.returnLogin = function () {
                $state.go('login', { 'CheckUpdate': 'N' }, { reload: true });
            };
            $scope.upgrade = function () {
                $ionicLoading.show({
                    template: "Download  0%"
                });
                var url = strWebSiteURL + "/FreightApp.apk";
                var blnError = false;
                $cordovaFile.checkFile(cordova.file.externalRootDirectory, "FreightApp.apk")
                .then(function (success) {
                    //
                }, function (error) {
                    blnError = true;
                });
                var targetPath = cordova.file.externalRootDirectory + "FreightApp.apk";
                var trustHosts = true;
                var options = {};
                if (!blnError) {
                    $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                        $ionicLoading.hide();
                        $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive'
                        ).then(function () {
                            // success
                        }, function (err) {
                            // error
                        });
                    }, function (err) {
                        $cordovaToast.showShortCenter('Download faild.');
                        $ionicLoading.hide();
                        $state.go('login', { 'CheckUpdate': 'N' }, { reload: true });
                    }, function (progress) {
                        $timeout(function () {
                            var downloadProgress = (progress.loaded / progress.total) * 100;
                            $ionicLoading.show({
                                template: "Download  " + Math.floor(downloadProgress) + "%"
                            });
                            if (downloadProgress > 99) {
                                $ionicLoading.hide();
                            }
                        })
                    });
                } else {
                    $ionicLoading.hide();
                    $cordovaToast.showShortCenter('Check APK file faild.');
                    $state.go('login', { 'CheckUpdate': 'N' }, { reload: true });
                }
            };
        }]);

appControllers.controller('MainCtrl',
        ['$scope', '$http', '$state', '$stateParams', '$timeout', '$ionicPopup', 'WebApiService',
        function ($scope, $http, $state, $stateParams, $timeout, $ionicPopup, WebApiService) {
			$scope.LoginInfo = {
				UserName: sessionStorage.getItem("UserId")
			};
            $scope.GoToSA = function () {
                $state.go('salesmanActivity', {}, { reload: true });
            };
            $scope.GoToRcbp = function () {
                $state.go('contacts', {}, { reload: true });
            };
            $scope.GoToPa = function () {
                //$state.go('paymentApproval', {}, { reload: true });
            };
            $scope.GoToVS = function () {
                $state.go('vesselSchedule', {}, { reload: true });
            };
            $scope.GoToSS = function () {
                $state.go('shipmentStatus', {}, { reload: true });
            };
            $scope.GoToInv = function () {
                $state.go('invoice', {}, { reload: true });
            };
            $scope.GoToBL= function () {
                $state.go('bl', {}, { reload: true });
            };
            $scope.GoToAWB = function () {
                $state.go('awb', {}, { reload: true });
            };
            $scope.GoToSOA = function () {
                $state.go('soa', {}, { reload: true });
            };
            $scope.GoToMemo = function () {
                $state.go('memo', {}, { reload: true });
            };
            $scope.GoToReminder = function () {
                $state.go('reminder', {}, { reload: true });
            };
			$scope.GoToLogin = function () {
                $state.go('loading', {}, { reload: true });
            };
			$scope.GoToSetting = function () {
                $state.go('setting', {}, { reload: true });
            };
			$scope.GoToUpdate = function () {
				var url = strWebServiceURL + strBaseUrl + '/update.json';
                $http.get(url)
                .success(function (res) {
                        var serverAppVersion = res.version;
                        $cordovaAppVersion.getVersionNumber().then(function (version) {
                            if (version != serverAppVersion) {
                                $state.go('update', { 'Version': serverAppVersion });
                            } else {
                                var alertPopup = $ionicPopup.alert({
                                    title: "Already the Latest Version!",
                                    okType: 'button-assertive'
                                });
                                $timeout(function () {
                                    alertPopup.close();
                                }, 2500);
                            }
                        });
                    })
                .error(function (res) {
                        var alertPopup = $ionicPopup.alert({
                            title: "Connect Update Server Error!",
                            okType: 'button-assertive'
                        });
                        $timeout(function () {
                            alertPopup.close();
                        }, 2500);
                    });
            };
        }]);

appControllers.controller('SalesmanActivityCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaDialogs', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaDialogs, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            // initial echarts
            var myChart = echarts.init(document.getElementById('echartsPie'));
            var option = {
                title: {
                    text: 'Salesman',
                    subtext: 'Access Source',
                    x: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient: 'vertical',
                    x: 'left',
                    data: ['DA', 'EDM', 'ADs', 'VedioADs', 'SE']
                },
                toolbox: {
                    show: false,
                    feature: {
                        magicType: {
                            show: true,
                            type: ['pie', 'funnel'],
                            option: {
                                funnel: {
                                    x: '25%',
                                    width: '50%',
                                    funnelAlign: 'left',
                                    max: 1548
                                }
                            }
                        },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
                calculable: true,
                series: [
                    {
                        name: 'Access Source',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: [
                            { value: 335, name: 'DA' },
                            { value: 310, name: 'EDM' },
                            { value: 234, name: 'ADs' },
                            { value: 135, name: 'VedioADs' },
                            { value: 1548, name: 'SE' }
                        ]
                    }
                ]
            };
            myChart.setOption(option);
        }]);

appControllers.controller('ContactsCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaDialogs', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaDialogs, WebApiService) {
			$scope.Rcbp = {
                BusinessPartyName: ''
            };
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.GoToList = function () {
                $state.go('contactsList', { 'BusinessPartyName': $scope.Rcbp.BusinessPartyName }, { reload: true });
            };
			$scope.GoToAdd = function () {
                $state.go('contactsDetailAdd', { 'TrxNo':'New', 'BusinessPartyName': 'New' }, { reload: true });
            };
			$('#iBusinessPartyName').on('keydown', function (e) {
                if (e.which === 9 || e.which === 13) {
                    $scope.GoToList();
                }
            });
            $('#iBusinessPartyName').focus();
        }]);

appControllers.controller('ContactsListCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$ionicScrollDelegate', '$cordovaDialogs', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $ionicScrollDelegate, $cordovaDialogs, WebApiService) {
			var RecordCount = 0;
			var dataResults = new Array();
			$scope.Rcbp = {
                BusinessPartyName: $stateParams.BusinessPartyName,
				moreDataCanBeLoaded: true
            };
            $scope.returnSearch = function () {
                $state.go('contacts', {}, {});
            };
            $scope.GoToDetail = function (Rcbp1) {
                $state.go('contactsDetail', { 'TrxNo': Rcbp1.TrxNo, 'BusinessPartyName': $stateParams.BusinessPartyName }, { reload: true });
            };			
			$scope.GoToAdd = function () {
                $state.go('contactsDetailAdd', { 'TrxNo': 'New', 'BusinessPartyName': $stateParams.BusinessPartyName }, { reload: true });
            };
			$scope.loadMore = function() {
				var strUri = "/api/freight/rcbp1/sps/" + RecordCount;
				if ($scope.Rcbp.BusinessPartyName != null && $scope.Rcbp.BusinessPartyName.length > 0) {
                    strUri = strUri + "/" + $scope.Rcbp.BusinessPartyName;
                }
                var onSuccess = function (response) {
					if(response.data.results.length > 0){
						dataResults = dataResults.concat(response.data.results);
						$scope.Rcbp1s = dataResults;
						RecordCount = RecordCount + 20;
						$scope.Rcbp.moreDataCanBeLoaded = true;
					}else{
						$scope.Rcbp.moreDataCanBeLoaded = false;
					}
                };
				var onError = function (response) {
                };
                var onFinally = function (response) {
					$scope.$broadcast('scroll.infiniteScrollComplete');
                };
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
			};
            var getRcbp1 = function (BusinessPartyName) {
                $ionicLoading.show();
				RecordCount = 0;				
				$scope.Rcbp.moreDataCanBeLoaded = true;
				dataResults = new Array();
                $scope.Rcbp1s = dataResults;
                var strUri = "/api/freight/rcbp1/sps/" + RecordCount;
                if (BusinessPartyName != null && BusinessPartyName.length > 0) {
                    strUri = strUri + "/" + $scope.Rcbp.BusinessPartyName;
                }
                var onSuccess = function (response) {
					if(response.data.results.length > 0){
						dataResults = dataResults.concat(response.data.results);
						RecordCount = RecordCount + 20;                    
                        $scope.Rcbp.moreDataCanBeLoaded = true;
					}
					$scope.Rcbp1s = dataResults;
                };
                var onError = function (response) {
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                    $ionicScrollDelegate.scrollTop();
                };
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
            };
        }]);

appControllers.controller('ContactsDetailCtrl',
        ['$scope', '$stateParams', '$state', '$timeout', '$ionicHistory', '$ionicLoading', '$ionicPopup', '$ionicModal', 'WebApiService',
        function ($scope, $stateParams, $state, $timeout, $ionicHistory, $ionicLoading, $ionicPopup, $ionicModal, WebApiService) {
            $scope.rcbpDetail = {
				TrxNo: $stateParams.TrxNo
			};
            $scope.rcbp3Detail = {};
            $scope.returnList = function () {
				$state.go('contactsList', { 'BusinessPartyName': $stateParams.BusinessPartyName }, {});
            };
            $scope.GoToDetailEdit = function () {
                $state.go('contactsDetailEdit', { 'TrxNo': $scope.rcbpDetail.TrxNo, 'BusinessPartyName': $stateParams.BusinessPartyName }, { reload: true });
            };
            $scope.blnContainNameCard = function (rcbp3) {
                if (typeof (rcbp3) == "undefined") return false;
                if (typeof (rcbp3.NameCard) == "undefined") return false;
                if (rcbp3.NameCard.length > 0) {
                    return true;
                } else { return false; }
            };
			$scope.ShowDate= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy');
				} else {
					return '';
				}
			};
			var onFinally = function (response) {
				$ionicLoading.hide();
			};
            var GetRcbp3s = function (BusinessPartyCode) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcbp3?BusinessPartyCode=" + BusinessPartyCode;
                var onSuccess = function (response) {
                    $scope.rcbp3s = response.data.results;
                };
                var onError = function (response) {
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.GetParam(strUri, onSuccess, onError, onFinally);
            };
            var GetRcbp1Detail = function (TrxNo) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcbp1/trxNo/" + TrxNo;
                var onSuccess = function (response) {
                    $scope.rcbpDetail = response.data.results[0];
                    $ionicLoading.hide();
                    GetRcbp3s($scope.rcbpDetail.BusinessPartyCode);
                };
                var onError = function (response) {
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
            };
            GetRcbp1Detail($scope.rcbpDetail.TrxNo);
            $ionicModal.fromTemplateUrl('rcbp3Detail.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
            });
            $scope.$on('$destroy', function () {
                $scope.modal.remove();
            });//Cleanup the modal when done with it!
            $scope.openModal = function (rcbp3) {
                $scope.rcbp3Detail = rcbp3;
                $scope.modal.show();
            };
            $scope.closeModal = function () {
                $scope.modal.hide();
            };
        }]);

appControllers.controller('ContactsDetailEditCtrl',
        ['$scope', '$stateParams', '$state', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $stateParams, $state, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.rcbpDetail = {
				TrxNo: $stateParams.TrxNo
			};
            $scope.rcbp3Detail = {};
            $scope.returnDetail = function () {
                $state.go('contactsDetail', { 'TrxNo': $scope.rcbpDetail.TrxNo,'BusinessPartyName': $stateParams.BusinessPartyName }, { reload: true });
            };
            var GetRcbp3s = function (BusinessPartyCode) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcbp3?BusinessPartyCode=" + BusinessPartyCode;
                var onSuccess = function (response) {
                    $scope.rcbp3s = response.data.results;
                    $ionicLoading.hide();
                };
                var onError = function (response) {
                    $ionicLoading.hide();
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.GetParam(strUri, onSuccess, onError, onFinally);
            };
            var GetRcbp1Detail = function (TrxNo) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcbp1/trxNo/" + TrxNo;
                var onSuccess = function (response) {
                    $scope.rcbpDetail = response.data.results[0];
                    $ionicLoading.hide();
                    GetRcbp3s($scope.rcbpDetail.BusinessPartyCode);
                };
                var onError = function (response) {
                    $ionicLoading.hide();
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
            };
            GetRcbp1Detail($scope.rcbpDetail.TrxNo);
            $scope.returnUpdateRcbp1 = function () {
                $ionicLoading.show();
                var jsonData = { "rcbp1": $scope.rcbpDetail };
                var strUri = "/api/freight/rcbp1";
                var onSuccess = function (response) {
                    $ionicLoading.hide();
                    $scope.returnDetail();
                };
                var onError = function () {
                    $ionicLoading.hide();
                };
                WebApiService.Post(strUri, jsonData, onSuccess, onError);
            };
        }]);

appControllers.controller('ContactsDetailAddCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
			var TrxNo = $stateParams.TrxNo;
			var BusinessPartyName = $stateParams.BusinessPartyName;
			$scope.returnTo = function () {
				if(BusinessPartyName != 'New'){
					$state.go('contactsList', { 'BusinessPartyName': BusinessPartyName }, {});
				}else{
					$state.go('contacts', {}, {});
				}
            };
			$scope.returnAddRcbp1 = function(){
			};
		}]);
		
appControllers.controller('PaymentApprovalCtrl',
        ['$scope', '$state', '$timeout', '$ionicHistory', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $timeout, $ionicHistory, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.plcp1 = {};
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.showApproval = function () {
                var alertPopup = $ionicPopup.alert({
                    title: "Approval Success!",
                    okType: 'button-calm'
                });
                $timeout(function () {
                    alertPopup.close();
                }, 2500);
            };
            $scope.plcpStatus = { text: "USE", checked: false };
            $scope.plcpStatusChange = function () {
                if ($scope.plcpStatus.checked) {
                    $scope.plcpStatus.text = "APP";
                } else {
                    $scope.plcpStatus.text = "USE";
                }
                //
                getPlcp1(null, null, $scope.plcpStatus.text);
            };
            $scope.refreshRcbp1 = function (BusinessPartyName) {
                var strUri = "/api/freight/rcbp1/" + BusinessPartyName;
                var onSuccess = function (response) {
                    $scope.Rcbp1s = response.data.results;
                };
                WebApiService.Get(strUri, onSuccess);
            };
            $scope.funcShowDatetime = function (utc) {
                if (typeof (utc) === 'undefined') return ''
                var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
                var newDate = new Date(utcDate);
                if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
                    return newDate.Format('yyyy-MM-dd hh:mm');
                } else {
                    return '';
                }
            };
            var getPlcp1 = function (VoucherNo, VendorName, StatusCode) {
                $ionicLoading.show();
                var strUri = "/api/freight/plcp1";
                if (VoucherNo != null && VoucherNo.length > 0) {
                    strUri = strUri + "/VoucherNo/" + VoucherNo;
                }else if (VendorName != null && VendorName.length > 0) {
                    strUri = strUri + "/VendorName/" + VendorName;
                }
                if (StatusCode != null && StatusCode.length > 0) {
                    strUri = strUri + "/" + StatusCode;
                }
                var onSuccess = function (response) {
                    $scope.Plcp1s = response.data.results;
                };
                var onError = function (response) {
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.Get(strUri, onSuccess, onFinally);
            };
            getPlcp1(null, null, $scope.plcpStatus.text);
        }]);

appControllers.controller('VesselScheduleCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.rcvy = {
                PortOfDischargeName: ''
            };
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.GoToDetail = function (PortOfDischargeName) {
                $state.go('vesselScheduleDetail', { 'PortOfDischargeName': PortOfDischargeName }, { reload: true });
            };
            $('#txt-PortOfDischargeName').on('keydown', function (e) {
                if (e.which === 9 || e.which === 13) {
                    getRcvy1($scope.rcvy.PortOfDischargeName);
                }
            });
            var getRcvy1 = function (PortOfDischargeName) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcvy1";
                if (PortOfDischargeName != null && PortOfDischargeName.length > 0) {
                    strUri = strUri + "/" + PortOfDischargeName;
                }
                var onSuccess = function (response) {
                    $ionicLoading.hide();
                    $scope.PortOfDischargeNames = response.data.results;
                };
                var onError = function (response) {
                    $ionicLoading.hide();
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.Get(strUri, onSuccess, onFinally);
            };
            getRcvy1(null);
        }]);

appControllers.controller('VesselScheduleDetailCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.Rcvy1Detail = {
                PortOfDischargeName : $stateParams.PortOfDischargeName
            };
            $scope.returnList = function () {
                $state.go('vesselSchedule', {}, {});
            };
            $scope.ShowDate= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy');
				} else {
					return '';
				}
			};$scope.ShowDatetime= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy HH:mm');
				} else {
					return '';
				}
			};
            var getRcvy1 = function (PortOfDischargeName) {
                $ionicLoading.show();
                var strUri = "/api/freight/rcvy1/sps/" + PortOfDischargeName;
                var onSuccess = function (response) {
                    $ionicLoading.hide();
                    $scope.Rcvy1s = response.data.results;
                };
                var onError = function (response) {
                    $ionicLoading.hide();
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                WebApiService.Get(strUri, onSuccess, onFinally);
            };
            getRcvy1($scope.Rcvy1Detail.PortOfDischargeName);
        }]);

appControllers.controller('ShipmentStatusCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.Tracking = {
                ContainerNo: '',
                JobNo: '',
                BLNo: '',
                AWBNo: '',
                OrderNo: '',
                ReferenceNo: ''
            };
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            var getSearchResult = function (FilterName, FilterValue) {
                $ionicLoading.show();
                var strUri = "";
                var onSuccess = null;
                var onError = function (response) {
                    $ionicLoading.hide();
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                if (FilterName === 'ContainerNo') {
                    strUri = "/api/freight/tracking/ContainerNo/count/" + FilterValue;
                    onSuccess = function (response) {
                        $ionicLoading.hide();
                        if (response.data.results.length > 1) {
                            $state.go('shipmentStatusList', { 'FilterName': FilterName, 'FilterValue': FilterValue }, { reload: true });
                        } else if (response.data.results.length === 1) {
							$ionicLoading.show();							
							strUri = '/api/freight/tracking/ContainerNo/sps/0/' + FilterValue;				
							onSuccess = function (response) {
								if(response.data.results.length > 0){
									$state.go('shipmentStatusDetail', { 'FilterName': FilterName, 'FilterValue': response.data.results[0].JobNo, 'ModuleCode': response.data.results[0].ModuleCode }, { reload: true });
								}
							};
							WebApiService.Get(strUri, onSuccess, onError, onFinally);
                        } else {
                            var alertPopup = $ionicPopup.alert({
                                title: 'No Records Found.',
                                okType: 'button-assertive'
                            });
                            $timeout(function () {
                                alertPopup.close();
                            }, 2500);
                        }
                    };
                } else {
                    $ionicLoading.hide();
                    var alertPopup = $ionicPopup.alert({
                        title: 'No Records Found.',
                        okType: 'button-assertive'
                    });
                    $timeout(function () {
                        alertPopup.close();
                    }, 2500);
                    return;
                    //To-Do
                }
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
            };
            $scope.GoToDetail = function (FilterName) {
                var FilterValue = '';
                if (FilterName === 'ContainerNo') { FilterValue = $scope.Tracking.ContainerNo }
                else if (FilterName === 'JobNo') { FilterValue = $scope.Tracking.JobNo }
                else if (FilterName === 'BLNo') { FilterValue = $scope.Tracking.BLNo }
                else if (FilterName === 'AWBNo') { FilterValue = $scope.Tracking.AWBNo }
                else if (FilterName === 'OrderNo') { FilterValue = $scope.Tracking.OrderNo }
                else if (FilterName === 'ReferenceNo') { FilterValue = $scope.Tracking.ReferenceNo }
                if (FilterValue.length > 0) {
                    getSearchResult(FilterName, FilterValue);
                } else {
                    var alertPopup = $ionicPopup.alert({
                        title: FilterName + ' is Empty.',
                        okType: 'button-assertive'
                    });
                    $timeout(function () {
                        alertPopup.close();
                    }, 2500);
                }
            };
			$('#iContainerNo').on('keydown', function (e) {
                if (e.which === 9 || e.which === 13) {
                    $scope.GoToDetail('ContainerNo');
                }
            });
        }]);

appControllers.controller('ShipmentStatusListCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, WebApiService) {
            var RecordCount = 0;
			var dataResults = new Array();
			$scope.List = {
				FilterName:		$stateParams.FilterName,
				FilterValue:	$stateParams.FilterValue,
				moreDataCanBeLoaded: true
			};
            $scope.returnShipmentStatus = function () {
                $state.go('shipmentStatus', {}, {});
            };
			$scope.GoToDetail = function (Jmjm1) {
				$state.go('shipmentStatusDetail', { 'FilterName': $scope.List.FilterName, 'FilterValue': Jmjm1.JobNo, 'ModuleCode': Jmjm1.ModuleCode }, { reload: true });    
            };
			$scope.ShowDate= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy');
				} else {
					return '';
				}
			};
			$scope.ShowDatetime= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy HH:mm');
				} else {
					return '';
				}
			};
			$scope.funcShowLabel = function(FilterName){
				if(FilterName === $scope.List.FilterName){
					return true;
				}else { return false; }				
			};
			$scope.funcLoadMore = function() {
				if ($scope.List.FilterName === 'ContainerNo') {
					var strUri = '/api/freight/tracking/ContainerNo/sps/' + RecordCount + '/' + $scope.List.FilterValue;				
					var onSuccess = function (response) {
						if(response.data.results.length > 0){
							dataResults = dataResults.concat(response.data.results);						
							$scope.Jmjm1s = dataResults;
							RecordCount = RecordCount + 20;
							$scope.List.moreDataCanBeLoaded = true;
						}else{
							$scope.List.moreDataCanBeLoaded = false;
						}
					};
					var onError = function (response) {
					};
					var onFinally = function (response) {
						$scope.$broadcast('scroll.infiniteScrollComplete');
					};
					WebApiService.Get(strUri, onSuccess, onError, onFinally);
				}
			};
        }]);

appControllers.controller('ShipmentStatusDetailCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicHistory', '$ionicLoading', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicHistory, $ionicLoading, $ionicPopup, WebApiService) {
            $scope.Detail = {};
            $scope.Detail.FilterName = $stateParams.FilterName;
            $scope.Detail.FilterValue = $stateParams.FilterValue;
			$scope.Detail.ModuleCode = $stateParams.ModuleCode;
            $scope.returnList = function () {
				if ($ionicHistory.backView()) {
					$ionicHistory.goBack();
				}else{
					$state.go('shipmentStatus', {}, {});
				}
            };
            $scope.ShowDate= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy');
				} else {
					return '';
				}
			};
			$scope.ShowDatetime= function (utc) {
				if (typeof (utc) === 'undefined') return ''
				var utcDate = Number(utc.substring(utc.indexOf('(') + 1, utc.lastIndexOf('-')));
				var newDate = new Date(utcDate);
				if (newDate.getUTCFullYear() < 2166 && newDate.getUTCFullYear() > 1899) {
					return newDate.Format('dd-NNN-yyyy HH:mm');
				} else {
					return '';
				}
			};			
			$scope.funcShowLabel = function(FilterName){
				if(FilterName === $scope.Detail.FilterName){
					return true;
				}else { return false; }				
			};
            var getJmjm1 = function (FilterName, FilterValue, ModuleCode) {
                $ionicLoading.show();
                var strUri = '';
                var onSuccess = null;
                var onError = function (response) {
                };
                var onFinally = function (response) {
                    $ionicLoading.hide();
                };
                if (FilterName === 'ContainerNo') {
					if(ModuleCode != 'SE' && ModuleCode != 'SI' && ModuleCode != 'AE' && ModuleCode != 'AI'){						
						strUri = '/api/freight/tracking/ContainerNo/module/' + ModuleCode + '/' + FilterValue;
					}
					else{						
						strUri = '/api/freight/tracking/ContainerNo/' + ModuleCode + '/' + FilterValue;
					}
                    onSuccess = function (response) {
                        $scope.Jmjm1s = response.data.results;
                    };
                }
                WebApiService.Get(strUri, onSuccess, onError, onFinally);
            };
            getJmjm1($scope.Detail.FilterName, $scope.Detail.FilterValue, $scope.Detail.ModuleCode);
        }]);

appControllers.controller('InvoiceCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaFile', '$cordovaFileTransfer', '$cordovaFileOpener2', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.items = [
                { InvoiceNo: 'SESIN0905182-00', InvoiceDate: '04/11/2015', CustomerName: 'S A ORANJE 123', Amt: '100' },
                { InvoiceNo: 'SESIN1511137-02', InvoiceDate: '04/11/2015', CustomerName: 'KADIMA', Amt: '500' }
            ];
            $scope.download = function () {
                $ionicLoading.show({
                    template: "Download  0%"
                });
                var url = strWebServiceURL + "/mobileapp/INVOICE.pdf";
                var blnError = false;
                if (window.cordova) {
                    $cordovaFile.checkFile(cordova.file.externalRootDirectory, "INVOICE.pdf")
                    .then(function (success) {
                        //
                    }, function (error) {
                        blnError = true;
                    });
                    var targetPath = cordova.file.externalRootDirectory + "INVOICE.pdf";
                    var trustHosts = true;
                    var options = {};
                    if (!blnError) {
                        $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                            $ionicLoading.hide();
                            $cordovaFileOpener2.open(targetPath, 'application/pdf'
                            ).then(function () {
                                // success
                            }, function (err) {
                                // error
                            });
                        }, function (err) {
                            $cordovaToast.showShortCenter('Download faild.');
                            $ionicLoading.hide();
                        }, function (progress) {
                            $timeout(function () {
                                var downloadProgress = (progress.loaded / progress.total) * 100;
                                $ionicLoading.show({
                                    template: "Download  " + Math.floor(downloadProgress) + "%"
                                });
                                if (downloadProgress > 99) {
                                    $ionicLoading.hide();
                                }
                            })
                        });
                    } else {
                        $ionicLoading.hide();
                        $cordovaToast.showShortCenter('Download PDF file faild.');
                    }
                } else {
                    $ionicLoading.hide();
                    window.open(url);               
                }                
            };
            
        }]);

appControllers.controller('BlCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaFile', '$cordovaFileTransfer', '$cordovaFileOpener2', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.items = [
                { InvoiceNo: 'SESIN0905182-00', InvoiceDate: '04/11/2015', CustomerName: 'S A ORANJE 123', Amt: '100' },
                { InvoiceNo: 'SESIN1511137-02', InvoiceDate: '04/11/2015', CustomerName: 'KADIMA', Amt: '500' }
            ];
            $scope.download = function () {
                $ionicLoading.show({
                    template: "Download  0%"
                });
                var url = strWebServiceURL + "/mobileapp/HOUSE-BL.pdf";
                var blnError = false;
                if (window.cordova) {
                    $cordovaFile.checkFile(cordova.file.externalRootDirectory, "HOUSE-BL.pdf")
                    .then(function (success) {
                        //
                    }, function (error) {
                        blnError = true;
                    });
                    var targetPath = cordova.file.externalRootDirectory + "HOUSE-BL.pdf";
                    var trustHosts = true;
                    var options = {};
                    if (!blnError) {
                        $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                            $ionicLoading.hide();
                            $cordovaFileOpener2.open(targetPath, 'application/pdf'
                            ).then(function () {
                                // success
                            }, function (err) {
                                // error
                            });
                        }, function (err) {
                            $cordovaToast.showShortCenter('Download faild.');
                            $ionicLoading.hide();
                        }, function (progress) {
                            $timeout(function () {
                                var downloadProgress = (progress.loaded / progress.total) * 100;
                                $ionicLoading.show({
                                    template: "Download  " + Math.floor(downloadProgress) + "%"
                                });
                                if (downloadProgress > 99) {
                                    $ionicLoading.hide();
                                }
                            })
                        });
                    } else {
                        $ionicLoading.hide();
                        $cordovaToast.showShortCenter('Download PDF file faild.');
                    }
                } else {
                    $ionicLoading.hide();
                    window.open(url);
                }
            };
            
        }]);

appControllers.controller('AwbCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaFile', '$cordovaFileTransfer', '$cordovaFileOpener2', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.items = [
                { InvoiceNo: 'SESIN0905182-00', InvoiceDate: '04/11/2015', CustomerName: 'S A ORANJE 123', Amt: '100' },
                { InvoiceNo: 'SESIN1511137-02', InvoiceDate: '04/11/2015', CustomerName: 'KADIMA', Amt: '500' }
            ];
            $scope.download = function () {
                $ionicLoading.show({
                    template: "Download  0%"
                });
                var url = strWebServiceURL + "/mobileapp/AWB.pdf";
                var blnError = false;
                if (window.cordova) {
                    $cordovaFile.checkFile(cordova.file.externalRootDirectory, "AWB.pdf")
                    .then(function (success) {
                        //
                    }, function (error) {
                        blnError = true;
                    });
                    var targetPath = cordova.file.externalRootDirectory + "AWB.pdf";
                    var trustHosts = true;
                    var options = {};
                    if (!blnError) {
                        $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                            $ionicLoading.hide();
                            $cordovaFileOpener2.open(targetPath, 'application/pdf'
                            ).then(function () {
                                // success
                            }, function (err) {
                                // error
                            });
                        }, function (err) {
                            $cordovaToast.showShortCenter('Download faild.');
                            $ionicLoading.hide();
                        }, function (progress) {
                            $timeout(function () {
                                var downloadProgress = (progress.loaded / progress.total) * 100;
                                $ionicLoading.show({
                                    template: "Download  " + Math.floor(downloadProgress) + "%"
                                });
                                if (downloadProgress > 99) {
                                    $ionicLoading.hide();
                                }
                            })
                        });
                    } else {
                        $ionicLoading.hide();
                        $cordovaToast.showShortCenter('Download PDF file faild.');
                    }
                } else {
                    $ionicLoading.hide();
                    window.open(url);
                }
            };
            
        }]);

appControllers.controller('SOACtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicLoading', '$ionicPopup', '$cordovaFile', '$cordovaFileTransfer', '$cordovaFileOpener2', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.items = [
                { InvoiceNo: 'SESIN0905182-00', InvoiceDate: '04/11/2015', CustomerName: 'S A ORANJE 123', Amt: '100' },
                { InvoiceNo: 'SESIN1511137-02', InvoiceDate: '04/11/2015', CustomerName: 'KADIMA', Amt: '500' }
            ];
            $scope.download = function () {
                $ionicLoading.show({
                    template: "Download  0%"
                });
                var url = strWebServiceURL + "/mobileapp/CUSTOMER-STATEMENT.pdf";
                var blnError = false;
                if (window.cordova) {
                    $cordovaFile.checkFile(cordova.file.externalRootDirectory, "CUSTOMER-STATEMENT.pdf")
                    .then(function (success) {
                        //
                    }, function (error) {
                        blnError = true;
                    });
                    var targetPath = cordova.file.externalRootDirectory + "CUSTOMER-STATEMENT.pdf";
                    var trustHosts = true;
                    var options = {};
                    if (!blnError) {
                        $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                            $ionicLoading.hide();
                            $cordovaFileOpener2.open(targetPath, 'application/pdf'
                            ).then(function () {
                                // success
                            }, function (err) {
                                // error
                            });
                        }, function (err) {
                            $cordovaToast.showShortCenter('Download faild.');
                            $ionicLoading.hide();
                        }, function (progress) {
                            $timeout(function () {
                                var downloadProgress = (progress.loaded / progress.total) * 100;
                                $ionicLoading.show({
                                    template: "Download  " + Math.floor(downloadProgress) + "%"
                                });
                                if (downloadProgress > 99) {
                                    $ionicLoading.hide();
                                }
                            })
                        });
                    } else {
                        $ionicLoading.hide();
                        $cordovaToast.showShortCenter('Download PDF file faild.');
                    }
                } else {
                    $ionicLoading.hide();
                    window.open(url);
                }
            };
            
        }]);

appControllers.controller('MemoCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicPopup, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.Memo = {
                MemoInfo : 'Hello this is sysmagic mobile support'
            };
        }]);

appControllers.controller('ReminderCtrl',
        ['$scope', '$state', '$stateParams', '$timeout', '$ionicPopup', 'WebApiService',
        function ($scope, $state, $stateParams, $timeout, $ionicPopup, WebApiService) {
            $scope.returnMain = function () {
                $state.go('main', {}, {});
            };
            $scope.items = [
                { id: 1, Subject: 'Payment Voucher need Approve', Message: 'Please help to approve the ref no : PV15031841', CreateBy: 'S', UserID: 'S', DueDate: 'Nov 14,2015', DueTime: '11:20' },
                { id: 2, Subject: 'Email to Henry', Message: 'Need email to henry for the new request for the mobile at the monring.', CreateBy: 'S', UserID: 'S', DueDate: 'Nov 16,2015', DueTime: '09:20' }
            ];
        }]);