$(function() {
    if (typeof privs === 'undefined') {
        // just means the page has not declared this variable    
        log("privs is not defined");
    } else {
        log("check privs");
        if (privs) {
            log("check privs", privs, $.inArray("WRITE", privs));
            if ($.inArray("WRITE", privs) < 0) {
                return;
            }
            var formContainer = $(".contentForm");
            if (formContainer.length === 0) {
                return;
            }
            initInlineEdit(formContainer);
        }
    }
});

function initInlineEdit(formContainer) {
    log("initInlineEdit", formContainer, privs);
    var adminToolbar = $("<div class='adminToolbar'>");
    var btnEdit = $("<button class='edit'>Edit page</button>");
    btnEdit.click(function() {
        edifyPage(".contentForm");
    });
    var btnNew = $("<button class='new'>New Page</button>");
    btnNew.click(function() {
        var divTemplate = adminToolbar.find(".template");
        if (divTemplate.length === 0) {
            divTemplate = $("<div class='template well' style='display: none;'><p>Please wait while we get the list of templates...</p><img src='/static/common/ajax-loader.gif' /></div>");
            adminToolbar.append(divTemplate);
            divTemplate.show(300);
            listTemplates(function(resp) {
                log("got resp", resp);
                divTemplate.html("<h4>New page</h4><p>Select a page template</p><ul class='templates'></ul>");
                var ul = divTemplate.find("ul");
                $.each(resp, function(i, n) {
                    if (n.name.endsWith(".html")) {
                        ul.append("<li><a class='template' href='" + n.href + "'>" + n.name + "</a></li>");
                    }
                });
            });
            divTemplate.on("click", "a.template", function(e) {
                e.preventDefault();
                e.stopPropagation();
                var target = $(e.target);
                var href = window.location.pathname;
                href = toFolderPath(href);
                var targetHref = target.attr("href");
                href = href + "/autoname.new?template=" + targetHref;
                log("redirect to href:", href, "target=", targetHref);
                window.location.href = href;
            });
        } else {
            if (divTemplate.is(":visible")) {
                divTemplate.hide(300);
            } else {
                divTemplate.show(300);
            }
        }

    });
    adminToolbar.append(btnEdit).append(btnNew);
    $("body").append(adminToolbar);

    $("link").each(function(i, n) {
        var link = $(n);
        if (link.attr("rel") == "stylesheet" && link.attr("media") == "screen") {
            var href = link.attr("href");
            log("push theme css file", href);
            themeCssFiles.push(href);
        }
    });
    log("check for edit mode", window.location.href);
    if (window.location.pathname.endsWith(".new")) {
        $("body").addClass("edit-new-page");
        edifyPage(".contentForm");
    } else if (window.location.href.endsWith("editMode=true")) {
        edifyPage(".contentForm");
    }
}

function listTemplates(callback) {
    var url = "/theme/_DAV/PROPFIND?fields=name,href&depth=2";
    $.ajax({
        type: 'GET',
        url: url,
        success: function(resp) {
            $("body").trigger("ajaxLoading", {
                loading: false
            });
            if (callback) {
                callback(resp);
            }
        },
        error: function(resp) {
            log("error", resp);
            $("body").trigger("ajaxLoading", {
                loading: false
            });
            if (resp.status == 200) {
                if (callback) {
                    callback(name, resp);
                }
                return;
            }

            alert('There was a problem looking for templates');
        }
    });
}

function edifyPage(selector) {
    log("edifyPage", container);
    
    // If the page url is a folder, which is showing the index page, then we can't
    // edit it. We need to redirect to the actual index page
    var pageUrl = stripFragment(window.location.pathname);
    if( pageUrl.endsWith("/") ) {
        log("We appear to be on a folder path, so redirect to index page");
        window.location = pageUrl + "index.html?editMode=true";
        return;
    }
    
    $("body").removeClass("edifyIsViewMode");
    $("body").addClass("edifyIsEditMode");

    var container = $(selector);
    container.animate({
        opacity: 0
    }, 500);

    log("do ajax get...");
    $.ajax({
        type: 'GET',
        url: window.location.pathname,
        success: function(resp) {
            log("got page content");
            ajaxLoadingOff();
            var page = $(resp);
            var newContentForm = page.find(".contentForm");
            log("got data", newContentForm);
            $(".contentForm").replaceWith(newContentForm);

            // now we've loaded the content we must re-select the container
            container = $(selector);

            initHtmlEditors(container.find(".htmleditor"));

            $(".inputTextEditor").each(function(i, n) {
                var $n = $(n);
                var s = $n.text();
                $n.replaceWith("<input name='" + $n.attr("id") + "' type='text' value='" + s + "' />");
            });
            var formHref = window.location.pathname;
            if (formHref.endsWith("/")) {
                formHref += "index.html"; // when viewing the index page for a folder on the folder path, be sure to post to the actual page
            }
            container.wrap("<form id='edifyForm' action='" + formHref + "' method='POST'></form>");
            var form = $("#edifyForm");
            form.append("<input type='hidden' name='body' value='' />");
            var buttons = $("<div class='buttons'></div>");
            form.prepend(buttons);
            form.prepend("<div class='pageMessage'>.</div>");
            var title = $("<input type='text' name='title' id='title' title='Enter the page title here' class='required' />");
            title.val(document.title);
            buttons.append(title);
            buttons.append("<button title='Save edits to the page' class='save' type='submit'>Save</button>");
            buttons.append("<button title='View page history' class='history' type='button'>History</button>");
            var btnCancel = $("<button title='Return to view mode without saving. Any changes will be lost' class='cancel' type='button'>Cancel</button>");
            btnCancel.click(function() {
                if( $("body").hasClass("edit-new-page") ) {
                    window.location.href = "./";
                } else {
                    window.location.href = window.location.pathname;
                }
            });
            buttons.append(btnCancel);
            var btnHistory = buttons.find(".history");
            btnHistory.history({
                pageUrl: pageUrl,
                showPreview: true
            });


            form.submit(function(e) {
                e.preventDefault();
                log("inlineedit: edifyPage: submit page");
                submitEdifiedForm(function(resp) {
                    if (resp.nextHref) {
                        window.location.href = resp.nextHref;
                    } else {
                        window.location.href = pageUrl;
                    }
                });
            });
            log("now show again");
            container.animate({
                opacity: 1
            }, 500);
        },
        error: function(resp) {
            ajaxLoadingOff();
            alert("There was an error loading the page content into the editor. Please refresh the page and try again");
        }

    });

}


function reloadContent() {
    window.location.reload(); // TODO: use ajax to load content into current window (like pjax)
}