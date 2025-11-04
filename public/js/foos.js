function startup() {
	$(".season-selector").click(select_season);
	loaded_by_hash = load_section_by_hash();
	if (!loaded_by_hash) {
		load_season_section(default_season_id);
	}
}

function load_section_by_hash() {
    hash = window.location.hash.slice(1);
    hash_parts = hash.split('-');
    if (hash_parts.length != 2) {
        return false;
    } else {
        season_id = hash_parts[0];
        division_id = hash_parts[1];
        load_season_section(season_id, division_id);
        return true;
    }
}

function select_season() {
	season_id = $(this).data('season-id');
	load_season_section(season_id);
}

function load_season_section(season_id, initial_subsection = 0) {
	$("#content").load('ajax/season/' + season_id, function() { on_load_season_section(initial_subsection); });
	season_title = $(".season-selector[data-season-id=" + season_id + "]").text();
	$("#season-selected").text(season_title);
	return false;
}

function on_load_season_section(initial_subsection = 0) {
	$(".tab-summary").click(activate_tab_summary);
	$(".tab-division").click(activate_tab_division);
	$("#tab-link-" + initial_subsection).trigger("click");
}

function activate_tab_summary() {
	season_id = $(this).data('season-id');
	load_summary_subsection(season_id);
	$(".tab-element").removeClass("active");
	$("#tab-season-summary").addClass("active");
	window.location.hash = "#" + season_id + "-0";
	return false;
}

function activate_tab_division() {
	division_id = $(this).data('division-id');
	load_division_subsection(division_id);
	$(".tab-element").removeClass("active");
	$("#tab-division-" + division_id).addClass("active");
	window.location.hash = "#" + season_id + "-" + division_id;
	return false;
}


/* Summary subsection */

function load_summary_subsection(season_id) {
	$("#tab-content").load('ajax/summary/' + season_id, on_load_summary_subsection);
}

function on_load_summary_subsection() {
    activate_match_popovers();
}

function activate_match_popovers() {
    $('.match-result-popover').popover({
      container: 'body',
      trigger: 'hover',
      placement: 'auto',
      html: true,
      animation: false
    })
}


/* Division subsection */

function load_division_subsection(division_id) {
	$("#tab-content").load('ajax/division/' + division_id, on_load_division_subsection);
}

function on_load_division_subsection() {
    $(".player-rivals").click(activate_player_rivals);
    $("#simulator-modal").on('show.bs.modal', function (event) {
        button = $(event.relatedTarget);
        match_id = button.data('match-id');
        load_simulator_modal(match_id);
    });
    $("#history-modal").on('show.bs.modal', function (event) {
        button = $(event.relatedTarget);
        division_id = button.data('division-id');
        match_id = button.data('match-id');
        load_history_modal(division_id, match_id);
    });
    $("#history-modal").on('hide.bs.modal', function (event) {
        $("#history-content").text("");
    });
    $("#player-modal").on('show.bs.modal', function (event) {
        link = $(event.relatedTarget);
        division_id = link.data('division-id');
        player_id = link.data('player-id');
        load_player_modal(division_id, player_id);
    });
    $("#player-modal").on('hide.bs.modal', function (event) {
        $("#player-content").text("");
    });
    init_match_scope_filter();
    activate_match_popovers();
    if ($("#quick-match-form").length) {
        setup_quick_match_form();
    }
}

function init_match_scope_filter() {
    $('.match-scope-toggle').off('click').on('click', function(event) {
        event.preventDefault();
        scope = $(this).data('scope');
        $('.match-scope-toggle').removeClass('active').attr('aria-pressed', 'false');
        $(this).addClass('active').attr('aria-pressed', 'true');
        apply_match_scope_filter(scope);
    });
    initial_scope = $('.match-scope-toggle.active').data('scope');
    if (!initial_scope) {
        initial_scope = 'all';
    }
    apply_match_scope_filter(initial_scope);
}

function apply_match_scope_filter(scope) {
    allowed = ['all', 'league', 'quick'];
    if ($.inArray(scope, allowed) === -1) {
        scope = 'all';
    }
    show_quick = (scope === 'all' || scope === 'quick');
    show_league = (scope === 'all' || scope === 'league');

    $('[data-match-section]').each(function() {
        section = $(this);
        rows = section.find('tr[data-quick-match]');
        if (rows.length === 0) {
            return;
        }
        rows.each(function() {
            row = $(this);
            quick_flag = row.data('quick-match');
            is_quick = (quick_flag === true || quick_flag === 'true' || quick_flag === 1 || quick_flag === '1');
            if ((is_quick && show_quick) || (!is_quick && show_league)) {
                row.show();
            } else {
                row.hide();
            }
        });
        total_rows = rows.length;
        visible_rows = rows.filter(':visible').length;
        empty_row = section.find('.match-filter-empty-dynamic');
        if (total_rows > 0 && visible_rows === 0) {
            empty_row.show();
        } else {
            empty_row.hide();
        }
    });
}

function activate_player_rivals() {
    player_id = $(this).data('player-id');
    element = "#classification-detail-" + player_id;
	$(".classification-detail").hide();
	$("#classification-detail-" + player_id).show();
}


/* History modal */

function load_history_modal(division_id, match_id) {
	$("#history-content").load('ajax/history/' + division_id, function() { on_load_history_modal(match_id) } );
}

function on_load_history_modal(match_id = null) {
    $(".history-first").click(show_history_first);
    $(".history-last").click(show_history_last);
    $(".history-previous").click(show_history_previous);
    $(".history-next").click(show_history_next);
    if (match_id && match_id>0) {
      initial_step = $(".classification-history[data-match-id=" + match_id + "]").data("step");
    } else {
      initial_step = $("#classification-history-last-step").data("last-step");
    }
    $("#classification-history-" + initial_step).show()
}

function show_history_first() {
    $(".classification-history:visible").hide();
    $("#classification-history-1").show();
    return false;
}

function show_history_last() {
    $(".classification-history:visible").hide();
    last_step = $("#classification-history-last-step").data("last-step");
    $("#classification-history-" + last_step).show();
    return false;
}

function show_history_previous() {
    current = $(".classification-history:visible").data("step");
    if (current > 1) {
        previous = current - 1;
        $("#classification-history-" + current).hide();
        $("#classification-history-" + previous).show();
    }
    return false;
}

function show_history_next() {
    current = $(".classification-history:visible").data("step");
    last_step = $("#classification-history-last-step").data("last-step");
    if (current < last_step) {
        next = current + 1;
        $("#classification-history-" + current).hide()
        $("#classification-history-" + next).show()
    }
    return false;
}


/* Player modal */

function load_player_modal(division_id, player_id) {
	$("#player-content").load('ajax/player/' + player_id + '/' + division_id, on_load_player_modal);
}

function on_load_player_modal() {
    on_load_history_modal();
}

function setup_quick_match_form() {
    var form = $("#quick-match-form");
    var feedback = $("#quick-match-feedback");
    var submitButton = $("#quick-match-submit");
    var defaultButtonText = submitButton.text();
    var modeField = $("#quick-match-mode");
    var playerGroups = form.find('.quick-match-player-group');
    var playerSelects = form.find('.quick-match-player');

    function updatePlayerFieldsForMode(mode) {
        mode = (mode || '').toString().toLowerCase();
        if (mode !== 'singles' && mode !== 'doubles') {
            mode = 'doubles';
        }

        playerGroups.each(function() {
            var group = $(this);
            var slot = parseInt(group.data('slot'), 10);
            var select = group.find('.quick-match-player');
            var optional = (slot === 1 || slot === 3);
            if (mode === 'singles' && optional) {
                group.addClass('hidden');
                select.prop('disabled', true).prop('required', false).val('');
            } else {
                group.removeClass('hidden');
                select.prop('disabled', false).prop('required', true);
            }
        });
    }

    modeField.off('change').on('change', function() {
        updatePlayerFieldsForMode($(this).val());
    });

    updatePlayerFieldsForMode(modeField.val());

    form.off('submit').on('submit', function(event) {
        event.preventDefault();

        feedback.hide();
        feedback.removeClass('alert-success alert-danger alert-warning');

        var divisionId = parseInt(form.data('division-id'), 10);
        var apiKey = $("#quick-match-api-key").val().trim();
        var mode = (modeField.val() || '').toString().toLowerCase();
        if ($.inArray(mode, ['singles', 'doubles']) === -1) {
            mode = 'doubles';
        }

        var playerIds = [null, null, null, null];
        var presentPlayers = [];

        playerSelects.each(function() {
            var select = $(this);
            var slot = parseInt(select.data('slot'), 10);
            if (isNaN(slot)) {
                return;
            }
            var value = select.val();
            if (value) {
                var parsed = parseInt(value, 10);
                playerIds[slot] = parsed;
                presentPlayers.push(parsed);
            }
        });

        var requiredSlots = mode === 'singles' ? [0, 2] : [0, 1, 2, 3];
        var missingRequired = requiredSlots.some(function(slot) {
            return playerIds[slot] === null || playerIds[slot] === undefined;
        });
        if (missingRequired) {
            var message = mode === 'singles' ? 'Please select one player for each side.' : 'Please select four different players.';
            show_quick_match_feedback('warning', message);
            return;
        }

        var uniquePlayers = Array.from(new Set(presentPlayers));
        if (uniquePlayers.length !== presentPlayers.length) {
            show_quick_match_feedback('warning', 'Each player can only be selected once.');
            return;
        }

        if (!apiKey) {
            show_quick_match_feedback('warning', 'API key is required.');
            return;
        }

        submitButton.prop('disabled', true).text('Creating...');

        $.ajax({
            url: '/api/create_quick_match',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            headers: { 'X-API-KEY': apiKey },
            data: JSON.stringify({
                division_id: divisionId,
                player_ids: playerIds,
                mode: mode
            })
        }).done(function(response) {
            show_quick_match_feedback('success', 'Quick match created (ID #' + response.match.id + ').');
            form[0].reset();
            modeField.val('doubles');
            updatePlayerFieldsForMode(modeField.val());
            setTimeout(function() { load_division_subsection(divisionId); }, 600);
        }).fail(function(xhr) {
            var message = 'Could not create quick match.';
            if (xhr.responseJSON && xhr.responseJSON.error) {
                message = xhr.responseJSON.error;
            }
            show_quick_match_feedback('danger', message);
        }).always(function() {
            submitButton.prop('disabled', false).text(defaultButtonText);
        });
    });
}

function show_quick_match_feedback(type, message) {
    var feedback = $("#quick-match-feedback");
    feedback.removeClass('alert-success alert-danger alert-warning');
    feedback.addClass('alert-' + type);
    feedback.text(message);
    feedback.show();
}

/* Simulator modal */

function load_simulator_modal(match_id) {
	$("#simulator-content").load('ajax/simulator/' + match_id, on_load_simulator_modal);
}

function on_load_simulator_modal() {
	$(".result-selector").not('[aria-disabled="true"]').click(select_result);
    $(".result-direct").not(':disabled').click(select_result_direct);
}

function select_result() {
    if ($(this).is('[aria-disabled="true"]') || $(this).closest('li').hasClass('disabled')) {
        return false;
    }
	submatch = $(this).data('submatch');
    result_a = $(this).data('result-a');
    result_b = $(this).data('result-b');
    update_selected_result(submatch, result_a, result_b);
    $("#dropdown-" + submatch).dropdown("toggle");
    run_simulation();
    return false;
}

function select_result_direct() {
    if ($(this).is(':disabled')) {
        return false;
    }
	player = $(this).data("player");
	result_direct = $(this).data("result-direct");
	// FIXME: This if/else sequence could obviously be made
	// cleaner, but for the moment it works OK :)
	if (player == 0 && result_direct == 3) {
		update_selected_result(1, 5, 2);
		update_selected_result(2, 5, 2);
		update_selected_result(3, 5, 2);
	} else if (player == 0 && result_direct == 0) {
		update_selected_result(1, 2, 5);
		update_selected_result(2, 2, 5);
		update_selected_result(3, 2, 5);
	} else if (player == 1 && result_direct == 3) {
		update_selected_result(1, 5, 2);
		update_selected_result(2, 2, 5);
		update_selected_result(3, 2, 5);
	} else if (player == 1 && result_direct == 0) {
		update_selected_result(1, 2, 5);
		update_selected_result(2, 5, 2);
		update_selected_result(3, 5, 2);
	} else if (player == 2 && result_direct == 3) {
		update_selected_result(1, 2, 5);
		update_selected_result(2, 5, 2);
		update_selected_result(3, 2, 5);
	} else if (player == 2 && result_direct == 0) {
		update_selected_result(1, 5, 2);
		update_selected_result(2, 2, 5);
		update_selected_result(3, 5, 2);
	} else if (player == 3 && result_direct == 3) {
		update_selected_result(1, 2, 5);
		update_selected_result(2, 2, 5);
		update_selected_result(3, 5, 2);
	} else if (player == 3 && result_direct == 0) {
		update_selected_result(1, 5, 2);
		update_selected_result(2, 5, 2);
		update_selected_result(3, 2, 5);
	}
	run_simulation();
	return false;
}

function update_selected_result(submatch, result_a, result_b) {
	result_txt = result_a + '-' + result_b;
	$("#result-selected-" + submatch).text(result_txt);
	$("#result-selected-" + submatch).data('valid', 1);
	$("#result-selected-" + submatch).data('result-a', result_a);
	$("#result-selected-" + submatch).data('result-b', result_b);
}

function run_simulation() {
    if ($("#simulation-data").data('disabled')) {
        return false;
    }
    if ($("#result-selected-1").data("valid") != 1 &&
        $("#result-selected-2").data("valid") != 1 &&
        $("#result-selected-3").data("valid") != 1) {
		return false;
	}
    load_simulation();
	fill_victories();
}

function load_simulation() {
    match_id = $("#simulation-data").data('match-id');
    post_data = JSON.stringify({
        results: [
          [$("#result-selected-1").data('result-a'), $("#result-selected-1").data('result-b')],
          [$("#result-selected-2").data('result-a'), $("#result-selected-2").data('result-b')],
          [$("#result-selected-3").data('result-a'), $("#result-selected-3").data('result-b')]
        ]
    });
	$.post('ajax/simulation/' + match_id, post_data, on_load_simulation);
}

function fill_victories() {
	victories = [0, 0, 0, 0]
	if ($("#result-selected-1").data('result-a') == 5) {
		victories[0] += 1;
		victories[1] += 1;
	} else {
		victories[2] += 1;
		victories[3] += 1;
	}
	if ($("#result-selected-2").data('result-a') == 5) {
		victories[0] += 1;
		victories[2] += 1;
	} else {
		victories[1] += 1;
		victories[3] += 1;
	}
	if ($("#result-selected-3").data('result-a') == 5) {
		victories[0] += 1;
		victories[3] += 1;
	} else {
		victories[1] += 1;
		victories[2] += 1;
	}
	$("#player-victories-0").html(victories[0]);
	$("#player-victories-1").html(victories[1]);
	$("#player-victories-2").html(victories[2]);
	$("#player-victories-3").html(victories[3]);
}

function on_load_simulation(data, status) {
    $("#simulation-classification-new").html(data);
}

$(document).ready(startup)
