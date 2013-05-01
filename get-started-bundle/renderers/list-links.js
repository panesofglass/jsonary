(function (Jsonary) {

	Jsonary.render.Components.add("LIST_LINKS");
	
	Jsonary.render.register({
		component: Jsonary.render.Components.LIST_LINKS,
		update: function (element, data, context, operation) {
			// We don't care about data changes - when the links change, a re-render is forced anyway.
			return false;
		},
		renderHtml: function (data, context) {
			if (!data.readOnly()) {
				return context.renderHtml(data);
			}
			var result = "";
			if (context.uiState.editInPlace) {
				var html = '<span class="button">save</span>';
				result += context.actionHtml(html, "submit");
				var html = '<span class="button">cancel</span>';
				result += context.actionHtml(html, "cancel");
				result += context.renderHtml(context.uiState.submissionData, '~linkData');
				return result;
			}
			
			var links = data.links();
			for (var i = 0; i < links.length; i++) {
				var link = links[i];
				var html = '<span class="button link">' + Jsonary.escapeHtml(link.title || link.rel) + '</span>';
				result += context.actionHtml(html, 'follow-link', i);
			}

			if (context.uiState.submitLink != undefined) {
				var link = data.links()[context.uiState.submitLink];
				result += '<div class="prompt-outer"><div class="prompt-inner">';
				result += context.actionHtml('<div class="prompt-overlay"></div>', 'cancel');
				result += '<div class="prompt-box"><h1>' + Jsonary.escapeHtml(link.rel) + '</h1><h2>' + Jsonary.escapeHtml(link.method) + " " + Jsonary.escapeHtml(link.href) + '</h2>';
				result += '<div>' + context.renderHtml(context.uiState.submissionData, '~linkData') + '</div>';
				result += '</div>';
				result += '<div class="prompt-buttons">';
				result += context.actionHtml('<span class="button">Submit</span>', 'submit');
				result += context.actionHtml('<span class="button">cancel</span>', 'cancel');
				result += '</div>';
				result += '</div></div>';
			}
			
			result += context.renderHtml(data, "data");
			return result;
		},
		action: function (context, actionName, arg1) {
			if (actionName == "follow-link") {
				var link = context.data.links()[arg1];
				if (link.method == "GET" && link.submissionSchemas.length == 0) {
					// There's no data to prompt for, and GET links are safe, so we don't put up a dialog
					link.follow();
					return false;
				}
				context.uiState.submitLink = arg1;
				if (link.method == "PUT" && link.submissionSchemas.length == 0) {
					context.uiState.editing = context.data.editableCopy();
					context.uiState.submissionData = context.data.editableCopy();
				} else {
					context.uiState.submissionData = Jsonary.create().addSchema(link.submissionSchemas);
					link.submissionSchemas.createValue(function (submissionValue) {
						context.uiState.submissionData.setValue(submissionValue);
					});
				}
				if (link.method == "PUT") {
					context.uiState.editInPlace = true;
				}
				return true;
			} else if (actionName == "submit") {
				var link = context.data.links()[context.uiState.submitLink];
				link.follow(context.uiState.submissionData);
				delete context.uiState.submitLink;
				delete context.uiState.editInPlace;
				delete context.uiState.submissionData;
				return true;
			} else {
				delete context.uiState.submitLink;
				delete context.uiState.editInPlace;
				delete context.uiState.submissionData;
				return true;
			}
		},
		filter: function () {
			return true;
		},
		saveState: function (uiState, subStates) {
			var result = {};
			if (uiState.submitLink !== undefined) {
				result['~link'] = uiState.submitLink;
				result['~inPlace'] = uiState.editInPlace;
				result['~data'] = this.saveStateData(uiState.submissionData);
			}
			for (var key in subStates.data) {
				result[key] = subStates.data[key];
			}
			return result;
		},
		loadState: function (savedState) {
			var uiState = {};
			if (savedState['~link'] != undefined) {
				uiState.submitLink = savedState['~link'];
				uiState.editInPlace = savedState['~inPlace'];
				uiState.submissionData = this.loadStateData(savedState['~data']);
				delete savedState['~link'];
				delete savedState['~inPlace'];
				delete savedState['~data'];
				if (!uiState.submissionData) {
					uiState = {};
				}
			}
			return [
				uiState,
				{data: savedState}
			];
		}
	});

})(Jsonary);
